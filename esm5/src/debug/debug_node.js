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
import { getProp, getValue, isClassBasedValue } from '../render3/styling/class_and_style_bindings';
import { getStylingContextFromLView } from '../render3/styling/util';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext, loadLContextFromNode } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER, isPropMetadataString, renderStringify } from '../render3/util/misc_utils';
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
        var _this = this;
        var _a;
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
        get: function () { return this.nativeElement.nodeName; },
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
            var context = loadLContext(this.nativeNode);
            var lView = context.lView;
            var tData = lView[TVIEW].data;
            var tNode = tData[context.nodeIndex];
            var properties = collectPropertyBindings(tNode, lView, tData);
            var hostProperties = collectHostPropertyBindings(tNode, lView, tData);
            var className = collectClassNames(this);
            var output = tslib_1.__assign({}, properties, hostProperties);
            if (className) {
                output['className'] = output['className'] ? output['className'] + (" " + className) : className;
            }
            return output;
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
            var context = loadLContext(element);
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
    Object.defineProperty(DebugElement__POST_R3__.prototype, "classes", {
        get: function () {
            var classes = {};
            var element = this.nativeElement;
            if (element) {
                var lContext = loadLContextFromNode(element);
                var stylingContext = getStylingContextFromLView(lContext.nodeIndex, lContext.lView);
                if (stylingContext) {
                    for (var i = 10 /* SingleStylesStartPosition */; i < stylingContext.length; i += 4 /* Size */) {
                        if (isClassBasedValue(stylingContext, i)) {
                            var className = getProp(stylingContext, i);
                            var value = getValue(stylingContext, i);
                            if (typeof value == 'boolean') {
                                // we want to ignore `null` since those don't overwrite the values.
                                classes[className] = value;
                            }
                        }
                    }
                }
                else {
                    // Fallback, just read DOM.
                    var eClasses = element.classList;
                    for (var i = 0; i < eClasses.length; i++) {
                        classes[eClasses[i]] = true;
                    }
                }
            }
            return classes;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "styles", {
        get: function () {
            var styles = {};
            var element = this.nativeElement;
            if (element) {
                var lContext = loadLContextFromNode(element);
                var stylingContext = getStylingContextFromLView(lContext.nodeIndex, lContext.lView);
                if (stylingContext) {
                    for (var i = 10 /* SingleStylesStartPosition */; i < stylingContext.length; i += 4 /* Size */) {
                        if (!isClassBasedValue(stylingContext, i)) {
                            var styleName = getProp(stylingContext, i);
                            var value = getValue(stylingContext, i);
                            if (value !== null) {
                                // we want to ignore `null` since those don't overwrite the values.
                                styles[styleName] = value;
                            }
                        }
                    }
                }
                else {
                    // Fallback, just read DOM.
                    var eStyles = element.style;
                    for (var i = 0; i < eStyles.length; i++) {
                        var name_1 = eStyles.item(i);
                        styles[name_1] = eStyles.getPropertyValue(name_1);
                    }
                }
            }
            return styles;
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
        this.listeners.forEach(function (listener) {
            if (listener.name === eventName) {
                listener.callback(eventObj);
            }
        });
    };
    return DebugElement__POST_R3__;
}(DebugNode__POST_R3__));
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
        else if (tNode.child) {
            // Otherwise, its children have to be processed.
            _queryNodeChildrenR3(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
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
        if (elementsOnly && debugNode instanceof DebugElement__POST_R3__ && predicate(debugNode)) {
            matches.push(debugNode);
        }
        else if (!elementsOnly && predicate(debugNode)) {
            matches.push(debugNode);
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
    var bindingIndex = getFirstBindingIndex(tNode.propertyMetadataStartIndex, tData);
    while (bindingIndex < tNode.propertyMetadataEndIndex) {
        var value = void 0;
        var propMetadata = tData[bindingIndex];
        while (!isPropMetadataString(propMetadata)) {
            // This is the first value for an interpolation. We need to build up
            // the full interpolation by combining runtime values in LView with
            // the static interstitial values stored in TData.
            value = (value || '') + renderStringify(lView[bindingIndex]) + tData[bindingIndex];
            propMetadata = tData[++bindingIndex];
        }
        value = value === undefined ? lView[bindingIndex] : value += lView[bindingIndex];
        // Property metadata string has 3 parts: property name, prefix, and suffix
        var metadataParts = propMetadata.split(INTERPOLATION_DELIMITER);
        var propertyName = metadataParts[0];
        // Attr bindings don't have property names and should be skipped
        if (propertyName) {
            // Wrap value with prefix and suffix (will be '' for normal bindings), if they're defined.
            // Avoid wrapping for normal bindings so that the value doesn't get cast to a string.
            properties[propertyName] = (metadataParts[1] && metadataParts[2]) ?
                metadataParts[1] + value + metadataParts[2] :
                value;
        }
        bindingIndex++;
    }
    return properties;
}
/**
 * Retrieves the first binding index that holds values for this property
 * binding.
 *
 * For normal bindings (e.g. `[id]="id"`), the binding index is the
 * same as the metadata index. For interpolations (e.g. `id="{{id}}-{{name}}"`),
 * there can be multiple binding values, so we might have to loop backwards
 * from the metadata index until we find the first one.
 *
 * @param metadataIndex The index of the first property metadata string for
 * this node.
 * @param tData The data array for the current TView
 * @returns The first binding index for this binding
 */
function getFirstBindingIndex(metadataIndex, tData) {
    var currentBindingIndex = metadataIndex - 1;
    // If the slot before the metadata holds a string, we know that this
    // metadata applies to an interpolation with at least 2 bindings, and
    // we need to search further to access the first binding value.
    var currentValue = tData[currentBindingIndex];
    // We need to iterate until we hit either a:
    // - TNode (it is an element slot marking the end of `consts` section), OR a
    // - metadata string (slot is attribute metadata or a previous node's property metadata)
    while (typeof currentValue === 'string' && !isPropMetadataString(currentValue)) {
        currentValue = tData[--currentBindingIndex];
    }
    return currentBindingIndex + 1;
}
function collectHostPropertyBindings(tNode, lView, tData) {
    var properties = {};
    // Host binding values for a node are stored after directives on that node
    var hostPropIndex = tNode.directiveEnd;
    var propMetadata = tData[hostPropIndex];
    // When we reach a value in TView.data that is not a string, we know we've
    // hit the next node's providers and directives and should stop copying data.
    while (typeof propMetadata === 'string') {
        var propertyName = propMetadata.split(INTERPOLATION_DELIMITER)[0];
        properties[propertyName] = lView[hostPropIndex];
        propMetadata = tData[++hostPropIndex];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUdILE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQzdELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUc1RixPQUFPLEVBQUMsV0FBVyxFQUFFLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQzVFLE9BQU8sRUFBUSxNQUFNLEVBQVMsS0FBSyxFQUFFLE1BQU0sRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQy9FLE9BQU8sRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sNkNBQTZDLENBQUM7QUFDakcsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDbkUsT0FBTyxFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxvQkFBb0IsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQzNMLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxvQkFBb0IsRUFBRSxlQUFlLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMxRyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUN2RSxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFLN0M7O0dBRUc7QUFDSDtJQUNFLDRCQUFtQixJQUFZLEVBQVMsUUFBa0I7UUFBdkMsU0FBSSxHQUFKLElB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QU0sVUFBVSx3QkFBd0IsQ0FBQyxJQUFlO0lBQ3RELHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDakQsQ0FBQztBQVVEOztHQUVHO0FBQ0gsTUFBTSxDQUFDLElBQU0sU0FBUyxHQUFzQyxtQkFBbUIsQ0FBQztBQUVoRjs7R0FFRztBQUNILE1BQU0sQ0FBQyxJQUFNLFlBQVksR0FBeUMsc0JBQXNCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7Z2V0Vmlld0NvbXBvbmVudH0gZnJvbSAnLi4vcmVuZGVyMy9nbG9iYWxfdXRpbHNfYXBpJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE5BVElWRX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTdHlsaW5nSW5kZXh9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7aXNDb21wb25lbnQsIGlzTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7TFZpZXcsIFBBUkVOVCwgVERhdGEsIFRWSUVXLCBUX0hPU1R9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0UHJvcCwgZ2V0VmFsdWUsIGlzQ2xhc3NCYXNlZFZhbHVlfSBmcm9tICcuLi9yZW5kZXIzL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvc3R5bGluZy91dGlsJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50LCBnZXRDb250ZXh0LCBnZXRJbmplY3Rpb25Ub2tlbnMsIGdldEluamVjdG9yLCBnZXRMaXN0ZW5lcnMsIGdldExvY2FsUmVmcywgaXNCcm93c2VyRXZlbnRzLCBsb2FkTENvbnRleHQsIGxvYWRMQ29udGV4dEZyb21Ob2RlfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvZGlzY292ZXJ5X3V0aWxzJztcbmltcG9ydCB7SU5URVJQT0xBVElPTl9ERUxJTUlURVIsIGlzUHJvcE1ldGFkYXRhU3RyaW5nLCByZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlT3JOdWxsfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3L2luZGV4JztcblxuXG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgRGVidWdFdmVudExpc3RlbmVyIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGNhbGxiYWNrOiBGdW5jdGlvbikge31cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICByZWFkb25seSBpbmplY3RvcjogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IGNvbXBvbmVudEluc3RhbmNlOiBhbnk7XG4gIHJlYWRvbmx5IGNvbnRleHQ6IGFueTtcbiAgcmVhZG9ubHkgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IHByb3ZpZGVyVG9rZW5zOiBhbnlbXTtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z05vZGVfX1BSRV9SM19fIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXSA9IFtdO1xuICByZWFkb25seSBwYXJlbnQ6IERlYnVnRWxlbWVudHxudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogRGVidWdOb2RlfG51bGwsIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHRoaXMuX2RlYnVnQ29udGV4dCA9IF9kZWJ1Z0NvbnRleHQ7XG4gICAgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTtcbiAgICBpZiAocGFyZW50ICYmIHBhcmVudCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIHBhcmVudC5hZGRDaGlsZCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmluamVjdG9yOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29tcG9uZW50OyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5jb250ZXh0OyB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnJlZmVyZW5jZXM7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnByb3ZpZGVyVG9rZW5zOyB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnRWxlbWVudCBleHRlbmRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgcmVhZG9ubHkgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdO1xuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQ7XG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXTtcbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW107XG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpOiB2b2lkO1xufVxuZXhwb3J0IGNsYXNzIERlYnVnRWxlbWVudF9fUFJFX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BSRV9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgcmVhZG9ubHkgbmFtZSAhOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICByZWFkb25seSBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBhbnksIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUsIHBhcmVudCwgX2RlYnVnQ29udGV4dCk7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlTm9kZTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5wdXNoKGNoaWxkKTtcbiAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQ2hpbGQoY2hpbGQ6IERlYnVnTm9kZSkge1xuICAgIGNvbnN0IGNoaWxkSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKGNoaWxkSW5kZXggIT09IC0xKSB7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGUgfCBudWxsfSkucGFyZW50ID0gbnVsbDtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UoY2hpbGRJbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0Q2hpbGRyZW5BZnRlcihjaGlsZDogRGVidWdOb2RlLCBuZXdDaGlsZHJlbjogRGVidWdOb2RlW10pIHtcbiAgICBjb25zdCBzaWJsaW5nSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKHNpYmxpbmdJbmRleCAhPT0gLTEpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2Uoc2libGluZ0luZGV4ICsgMSwgMCwgLi4ubmV3Q2hpbGRyZW4pO1xuICAgICAgbmV3Q2hpbGRyZW4uZm9yRWFjaChjID0+IHtcbiAgICAgICAgaWYgKGMucGFyZW50KSB7XG4gICAgICAgICAgKGMucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKGMpO1xuICAgICAgICB9XG4gICAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRCZWZvcmUocmVmQ2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGQ6IERlYnVnTm9kZSk6IHZvaWQge1xuICAgIGNvbnN0IHJlZkluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YocmVmQ2hpbGQpO1xuICAgIGlmIChyZWZJbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQobmV3Q2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV3Q2hpbGQucGFyZW50KSB7XG4gICAgICAgIChuZXdDaGlsZC5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQobmV3Q2hpbGQpO1xuICAgICAgfVxuICAgICAgKG5ld0NoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UocmVmSW5kZXgsIDAsIG5ld0NoaWxkKTtcbiAgICB9XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW4odGhpcywgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgICAgICAgLmNoaWxkTm9kZXMgIC8vXG4gICAgICAgIC5maWx0ZXIoKG5vZGUpID0+IG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSBhcyBEZWJ1Z0VsZW1lbnRbXTtcbiAgfVxuXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT0gZXZlbnROYW1lKSB7XG4gICAgICAgIGxpc3RlbmVyLmNhbGxiYWNrKGV2ZW50T2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzTmF0aXZlRWxlbWVudHMoZGVidWdFbHM6IERlYnVnRWxlbWVudFtdKTogYW55IHtcbiAgcmV0dXJuIGRlYnVnRWxzLm1hcCgoZWwpID0+IGVsLm5hdGl2ZUVsZW1lbnQpO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlFbGVtZW50Q2hpbGRyZW4oXG4gICAgZWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+LCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSkge1xuICBlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuKFxuICAgIHBhcmVudE5vZGU6IERlYnVnTm9kZSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10pIHtcbiAgaWYgKHBhcmVudE5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgcGFyZW50Tm9kZS5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW4obm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuY2xhc3MgRGVidWdOb2RlX19QT1NUX1IzX18gaW1wbGVtZW50cyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBOb2RlO1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IE5vZGUpIHsgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTsgfVxuXG4gIGdldCBwYXJlbnQoKTogRGVidWdFbGVtZW50fG51bGwge1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubmF0aXZlTm9kZS5wYXJlbnROb2RlIGFzIEVsZW1lbnQ7XG4gICAgcmV0dXJuIHBhcmVudCA/IG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhwYXJlbnQpIDogbnVsbDtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBnZXRJbmplY3Rvcih0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlTm9kZTtcbiAgICByZXR1cm4gbmF0aXZlRWxlbWVudCAmJlxuICAgICAgICAoZ2V0Q29tcG9uZW50KG5hdGl2ZUVsZW1lbnQgYXMgRWxlbWVudCkgfHwgZ2V0Vmlld0NvbXBvbmVudChuYXRpdmVFbGVtZW50KSk7XG4gIH1cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICByZXR1cm4gZ2V0Q29tcG9uZW50KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KSB8fCBnZXRDb250ZXh0KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTtcbiAgfVxuXG4gIGdldCBsaXN0ZW5lcnMoKTogRGVidWdFdmVudExpc3RlbmVyW10ge1xuICAgIHJldHVybiBnZXRMaXN0ZW5lcnModGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpLmZpbHRlcihpc0Jyb3dzZXJFdmVudHMpO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueTt9IHsgcmV0dXJuIGdldExvY2FsUmVmcyh0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIGdldEluamVjdGlvblRva2Vucyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7IH1cbn1cblxuY2xhc3MgRGVidWdFbGVtZW50X19QT1NUX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IEVsZW1lbnQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmVOb2RlKTtcbiAgICBzdXBlcihuYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBuYXRpdmVFbGVtZW50KCk6IEVsZW1lbnR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/IHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50IDogbnVsbDtcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLm5hdGl2ZUVsZW1lbnQgIS5ub2RlTmFtZTsgfVxuXG4gIC8qKlxuICAgKiAgR2V0cyBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byBwcm9wZXJ0eSB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqICBUaGlzIG1hcCBpbmNsdWRlczpcbiAgICogIC0gUmVndWxhciBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgW2lkXT1cImlkXCJgKVxuICAgKiAgLSBIb3N0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBob3N0OiB7ICdbaWRdJzogXCJpZFwiIH1gKVxuICAgKiAgLSBJbnRlcnBvbGF0ZWQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGlkPVwie3sgdmFsdWUgfX1cIilcbiAgICpcbiAgICogIEl0IGRvZXMgbm90IGluY2x1ZGU6XG4gICAqICAtIGlucHV0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbbXlDdXN0b21JbnB1dF09XCJ2YWx1ZVwiYClcbiAgICogIC0gYXR0cmlidXRlIGJpbmRpbmdzIChlLmcuIGBbYXR0ci5yb2xlXT1cIm1lbnVcImApXG4gICAqL1xuICBnZXQgcHJvcGVydGllcygpOiB7W2tleTogc3RyaW5nXTogYW55O30ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGhpcy5uYXRpdmVOb2RlKSAhO1xuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIGNvbnN0IHROb2RlID0gdERhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuXG4gICAgY29uc3QgcHJvcGVydGllcyA9IGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKHROb2RlLCBsVmlldywgdERhdGEpO1xuICAgIGNvbnN0IGhvc3RQcm9wZXJ0aWVzID0gY29sbGVjdEhvc3RQcm9wZXJ0eUJpbmRpbmdzKHROb2RlLCBsVmlldywgdERhdGEpO1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNvbGxlY3RDbGFzc05hbWVzKHRoaXMpO1xuICAgIGNvbnN0IG91dHB1dCA9IHsuLi5wcm9wZXJ0aWVzLCAuLi5ob3N0UHJvcGVydGllc307XG5cbiAgICBpZiAoY2xhc3NOYW1lKSB7XG4gICAgICBvdXRwdXRbJ2NsYXNzTmFtZSddID0gb3V0cHV0WydjbGFzc05hbWUnXSA/IG91dHB1dFsnY2xhc3NOYW1lJ10gKyBgICR7Y2xhc3NOYW1lfWAgOiBjbGFzc05hbWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuXG4gIGdldCBhdHRyaWJ1dGVzKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30ge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30gPSB7fTtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KGVsZW1lbnQpO1xuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0Tm9kZUF0dHJzID0gKGxWaWV3W1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZSkuYXR0cnM7XG4gICAgY29uc3QgbG93ZXJjYXNlVE5vZGVBdHRyczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIEZvciBkZWJ1ZyBub2RlcyB3ZSB0YWtlIHRoZSBlbGVtZW50J3MgYXR0cmlidXRlIGRpcmVjdGx5IGZyb20gdGhlIERPTSBzaW5jZSBpdCBhbGxvd3MgdXNcbiAgICAvLyB0byBhY2NvdW50IGZvciBvbmVzIHRoYXQgd2VyZW4ndCBzZXQgdmlhIGJpbmRpbmdzIChlLmcuIFZpZXdFbmdpbmUga2VlcHMgdHJhY2sgb2YgdGhlIG9uZXNcbiAgICAvLyB0aGF0IGFyZSBzZXQgdGhyb3VnaCBgUmVuZGVyZXIyYCkuIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhlIGJyb3dzZXIgd2lsbCBsb3dlcmNhc2UgYWxsIG5hbWVzLFxuICAgIC8vIGhvd2V2ZXIgc2luY2Ugd2UgaGF2ZSB0aGUgYXR0cmlidXRlcyBhbHJlYWR5IG9uIHRoZSBUTm9kZSwgd2UgY2FuIHByZXNlcnZlIHRoZSBjYXNlIGJ5IGdvaW5nXG4gICAgLy8gdGhyb3VnaCB0aGVtIG9uY2UsIGFkZGluZyB0aGVtIHRvIHRoZSBgYXR0cmlidXRlc2AgbWFwIGFuZCBwdXR0aW5nIHRoZWlyIGxvd2VyLWNhc2VkIG5hbWVcbiAgICAvLyBpbnRvIGFuIGFycmF5LiBBZnRlcndhcmRzIHdoZW4gd2UncmUgZ29pbmcgdGhyb3VnaCB0aGUgbmF0aXZlIERPTSBhdHRyaWJ1dGVzLCB3ZSBjYW4gY2hlY2tcbiAgICAvLyB3aGV0aGVyIHdlIGhhdmVuJ3QgcnVuIGludG8gYW4gYXR0cmlidXRlIGFscmVhZHkgdGhyb3VnaCB0aGUgVE5vZGUuXG4gICAgaWYgKHROb2RlQXR0cnMpIHtcbiAgICAgIGxldCBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgdE5vZGVBdHRycy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0Tm9kZUF0dHJzW2ldO1xuXG4gICAgICAgIC8vIFN0b3AgYXMgc29vbiBhcyB3ZSBoaXQgYSBtYXJrZXIuIFdlIG9ubHkgY2FyZSBhYm91dCB0aGUgcmVndWxhciBhdHRyaWJ1dGVzLiBFdmVyeXRoaW5nXG4gICAgICAgIC8vIGVsc2Ugd2lsbCBiZSBoYW5kbGVkIGJlbG93IHdoZW4gd2UgcmVhZCB0aGUgZmluYWwgYXR0cmlidXRlcyBvZmYgdGhlIERPTS5cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyTmFtZSAhPT0gJ3N0cmluZycpIGJyZWFrO1xuXG4gICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IHROb2RlQXR0cnNbaSArIDFdO1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHJOYW1lXSA9IGF0dHJWYWx1ZSBhcyBzdHJpbmc7XG4gICAgICAgIGxvd2VyY2FzZVROb2RlQXR0cnMucHVzaChhdHRyTmFtZS50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZUF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhdHRyID0gZUF0dHJzW2ldO1xuICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3QgYXNzaWduIHRoZSBzYW1lIGF0dHJpYnV0ZSBib3RoIGluIGl0c1xuICAgICAgLy8gY2FzZS1zZW5zaXRpdmUgZm9ybSBhbmQgdGhlIGxvd2VyLWNhc2VkIG9uZSBmcm9tIHRoZSBicm93c2VyLlxuICAgICAgaWYgKGxvd2VyY2FzZVROb2RlQXR0cnMuaW5kZXhPZihhdHRyLm5hbWUpID09PSAtMSkge1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHIubmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICB9XG5cbiAgZ2V0IGNsYXNzZXMoKToge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSB7XG4gICAgY29uc3QgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSA9IHt9O1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGxDb250ZXh0ID0gbG9hZExDb250ZXh0RnJvbU5vZGUoZWxlbWVudCk7XG4gICAgICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0RnJvbUxWaWV3KGxDb250ZXh0Lm5vZGVJbmRleCwgbENvbnRleHQubFZpZXcpO1xuICAgICAgaWYgKHN0eWxpbmdDb250ZXh0KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjsgaSA8IHN0eWxpbmdDb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgICAgaWYgKGlzQ2xhc3NCYXNlZFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSkge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gZ2V0UHJvcChzdHlsaW5nQ29udGV4dCwgaSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gaWdub3JlIGBudWxsYCBzaW5jZSB0aG9zZSBkb24ndCBvdmVyd3JpdGUgdGhlIHZhbHVlcy5cbiAgICAgICAgICAgICAgY2xhc3Nlc1tjbGFzc05hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjaywganVzdCByZWFkIERPTS5cbiAgICAgICAgY29uc3QgZUNsYXNzZXMgPSBlbGVtZW50LmNsYXNzTGlzdDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQ2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNsYXNzZXNbZUNsYXNzZXNbaV1dID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xhc3NlcztcbiAgfVxuXG4gIGdldCBzdHlsZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgY29uc3Qgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KTtcbiAgICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcobENvbnRleHQubm9kZUluZGV4LCBsQ29udGV4dC5sVmlldyk7XG4gICAgICBpZiAoc3R5bGluZ0NvbnRleHQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgc3R5bGluZ0NvbnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgICAgICBpZiAoIWlzQ2xhc3NCYXNlZFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSkge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGVOYW1lID0gZ2V0UHJvcChzdHlsaW5nQ29udGV4dCwgaSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gaWdub3JlIGBudWxsYCBzaW5jZSB0aG9zZSBkb24ndCBvdmVyd3JpdGUgdGhlIHZhbHVlcy5cbiAgICAgICAgICAgICAgc3R5bGVzW3N0eWxlTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrLCBqdXN0IHJlYWQgRE9NLlxuICAgICAgICBjb25zdCBlU3R5bGVzID0gKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVTdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gZVN0eWxlcy5pdGVtKGkpO1xuICAgICAgICAgIHN0eWxlc1tuYW1lXSA9IGVTdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3R5bGVzO1xuICB9XG5cbiAgZ2V0IGNoaWxkTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSB0aGlzLm5hdGl2ZU5vZGUuY2hpbGROb2RlcztcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdOb2RlW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoIW5hdGl2ZUVsZW1lbnQpIHJldHVybiBbXTtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gbmF0aXZlRWxlbWVudC5jaGlsZHJlbjtcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlBbGxSMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIHRydWUpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5QWxsUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCBmYWxzZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZCB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09PSBldmVudE5hbWUpIHtcbiAgICAgICAgbGlzdGVuZXIuY2FsbGJhY2soZXZlbnRPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogV2FsayB0aGUgVE5vZGUgdHJlZSB0byBmaW5kIG1hdGNoZXMgZm9yIHRoZSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIHBhcmVudEVsZW1lbnQgdGhlIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgd2FsayBpcyBzdGFydGVkXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4sIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdLFxuICAgIGVsZW1lbnRzT25seTogdHJ1ZSk6IHZvaWQ7XG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogZmFsc2UpOiB2b2lkO1xuZnVuY3Rpb24gX3F1ZXJ5QWxsUjMoXG4gICAgcGFyZW50RWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4pIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChwYXJlbnRFbGVtZW50Lm5hdGl2ZU5vZGUpICE7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gY29udGV4dC5sVmlld1tUVklFV10uZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgcGFyZW50VE5vZGUsIGNvbnRleHQubFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCBwYXJlbnRFbGVtZW50Lm5hdGl2ZU5vZGUpO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IG1hdGNoIHRoZSBjdXJyZW50IFROb2RlIGFnYWluc3QgdGhlIHByZWRpY2F0ZSwgYW5kIGdvZXMgb24gd2l0aCB0aGUgbmV4dCBvbmVzLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSB0aGUgY3VycmVudCBUTm9kZVxuICogQHBhcmFtIGxWaWV3IHRoZSBMVmlldyBvZiB0aGlzIFROb2RlXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2F0ZSBzaG91bGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBjb25zdCBuYXRpdmVOb2RlID0gZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCh0Tm9kZSwgbFZpZXcpO1xuICAvLyBGb3IgZWFjaCB0eXBlIG9mIFROb2RlLCBzcGVjaWZpYyBsb2dpYyBpcyBleGVjdXRlZC5cbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgLy8gQ2FzZSAxOiB0aGUgVE5vZGUgaXMgYW4gZWxlbWVudFxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBfYWRkUXVlcnlNYXRjaFIzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgaWYgKGlzQ29tcG9uZW50KHROb2RlKSkge1xuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgdGhlIGhvc3Qgb2YgYSBjb21wb25lbnQsIHRoZW4gYWxsIG5vZGVzIGluIGl0cyB2aWV3IGhhdmUgdG8gYmUgcHJvY2Vzc2VkLlxuICAgICAgLy8gTm90ZTogdGhlIGNvbXBvbmVudCdzIGNvbnRlbnQgKHROb2RlLmNoaWxkKSB3aWxsIGJlIHByb2Nlc3NlZCBmcm9tIHRoZSBpbnNlcnRpb24gcG9pbnRzLlxuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgICBpZiAoY29tcG9uZW50VmlldyAmJiBjb21wb25lbnRWaWV3W1RWSUVXXS5maXJzdENoaWxkKSB7XG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgICAgICAgY29tcG9uZW50Vmlld1tUVklFV10uZmlyc3RDaGlsZCAhLCBjb21wb25lbnRWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSxcbiAgICAgICAgICAgIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgICAvLyBPdGhlcndpc2UsIGl0cyBjaGlsZHJlbiBoYXZlIHRvIGJlIHByb2Nlc3NlZC5cbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKHROb2RlLmNoaWxkLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gICAgLy8gSW4gYWxsIGNhc2VzLCBpZiBhIGR5bmFtaWMgY29udGFpbmVyIGV4aXN0cyBmb3IgdGhpcyBub2RlLCBlYWNoIHZpZXcgaW5zaWRlIGl0IGhhcyB0byBiZVxuICAgIC8vIHByb2Nlc3NlZC5cbiAgICBjb25zdCBub2RlT3JDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgaWYgKGlzTENvbnRhaW5lcihub2RlT3JDb250YWluZXIpKSB7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKFxuICAgICAgICAgIG5vZGVPckNvbnRhaW5lciwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIENhc2UgMjogdGhlIFROb2RlIGlzIGEgY29udGFpbmVyXG4gICAgLy8gVGhlIG5hdGl2ZSBub2RlIGhhcyB0byBiZSBjaGVja2VkLlxuICAgIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgX2FkZFF1ZXJ5TWF0Y2hSMyhsQ29udGFpbmVyW05BVElWRV0sIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgLy8gRWFjaCB2aWV3IGluc2lkZSB0aGUgY29udGFpbmVyIGhhcyB0byBiZSBwcm9jZXNzZWQuXG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuSW5Db250YWluZXJSMyhsQ29udGFpbmVyLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgLy8gQ2FzZSAzOiB0aGUgVE5vZGUgaXMgYSBwcm9qZWN0aW9uIGluc2VydGlvbiBwb2ludCAoaS5lLiBhIDxuZy1jb250ZW50PikuXG4gICAgLy8gVGhlIG5vZGVzIHByb2plY3RlZCBhdCB0aGlzIGxvY2F0aW9uIGFsbCBuZWVkIHRvIGJlIHByb2Nlc3NlZC5cbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcobFZpZXcgISk7XG4gICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGNvbXBvbmVudFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gICAgY29uc3QgaGVhZDogVE5vZGV8bnVsbCA9XG4gICAgICAgIChjb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVt0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShoZWFkKSkge1xuICAgICAgZm9yIChsZXQgbmF0aXZlTm9kZSBvZiBoZWFkKSB7XG4gICAgICAgIF9hZGRRdWVyeU1hdGNoUjMobmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGhlYWQpIHtcbiAgICAgIGNvbnN0IG5leHRMVmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhYXMgTFZpZXc7XG4gICAgICBjb25zdCBuZXh0VE5vZGUgPSBuZXh0TFZpZXdbVFZJRVddLmRhdGFbaGVhZC5pbmRleF0gYXMgVE5vZGU7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhuZXh0VE5vZGUsIG5leHRMVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICAvLyBDYXNlIDQ6IHRoZSBUTm9kZSBpcyBhIHZpZXcuXG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModE5vZGUuY2hpbGQsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9XG5cbiAgLy8gV2UgZG9uJ3Qgd2FudCB0byBnbyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSByb290IG5vZGUuXG4gIGlmIChyb290TmF0aXZlTm9kZSAhPT0gbmF0aXZlTm9kZSkge1xuICAgIC8vIFRvIGRldGVybWluZSB0aGUgbmV4dCBub2RlIHRvIGJlIHByb2Nlc3NlZCwgd2UgbmVlZCB0byB1c2UgdGhlIG5leHQgb3IgdGhlIHByb2plY3Rpb25OZXh0XG4gICAgLy8gbGluaywgZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhlIGN1cnJlbnQgbm9kZSBoYXMgYmVlbiBwcm9qZWN0ZWQuXG4gICAgY29uc3QgbmV4dFROb2RlID0gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkgPyB0Tm9kZS5wcm9qZWN0aW9uTmV4dCA6IHROb2RlLm5leHQ7XG4gICAgaWYgKG5leHRUTm9kZSkge1xuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMobmV4dFROb2RlLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzIGFsbCBUTm9kZXMgaW4gYSBnaXZlbiBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdGhlIGNvbnRhaW5lciB0byBiZSBwcm9jZXNzZWRcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGRWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgICAgY2hpbGRWaWV3W1RWSUVXXS5ub2RlICEsIGNoaWxkVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hdGNoIHRoZSBjdXJyZW50IG5hdGl2ZSBub2RlIGFnYWluc3QgdGhlIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlTm9kZSB0aGUgY3VycmVudCBuYXRpdmUgbm9kZVxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNhdGUgc2hvdWxkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9hZGRRdWVyeU1hdGNoUjMoXG4gICAgbmF0aXZlTm9kZTogYW55LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4sIHJvb3ROYXRpdmVOb2RlOiBhbnkpIHtcbiAgaWYgKHJvb3ROYXRpdmVOb2RlICE9PSBuYXRpdmVOb2RlKSB7XG4gICAgY29uc3QgZGVidWdOb2RlID0gZ2V0RGVidWdOb2RlKG5hdGl2ZU5vZGUpO1xuICAgIGlmICghZGVidWdOb2RlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFR5cGUgb2YgdGhlIFwicHJlZGljYXRlIGFuZCBcIm1hdGNoZXNcIiBhcnJheSBhcmUgc2V0IGJhc2VkIG9uIHRoZSB2YWx1ZSBvZlxuICAgIC8vIHRoZSBcImVsZW1lbnRzT25seVwiIHBhcmFtZXRlci4gVHlwZVNjcmlwdCBpcyBub3QgYWJsZSB0byBwcm9wZXJseSBpbmZlciB0aGVzZVxuICAgIC8vIHR5cGVzIHdpdGggZ2VuZXJpY3MsIHNvIHdlIG1hbnVhbGx5IGNhc3QgdGhlIHBhcmFtZXRlcnMgYWNjb3JkaW5nbHkuXG4gICAgaWYgKGVsZW1lbnRzT25seSAmJiBkZWJ1Z05vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyAmJiBwcmVkaWNhdGUoZGVidWdOb2RlKSkge1xuICAgICAgbWF0Y2hlcy5wdXNoKGRlYnVnTm9kZSk7XG4gICAgfSBlbHNlIGlmICghZWxlbWVudHNPbmx5ICYmIChwcmVkaWNhdGUgYXMgUHJlZGljYXRlPERlYnVnTm9kZT4pKGRlYnVnTm9kZSkpIHtcbiAgICAgIChtYXRjaGVzIGFzIERlYnVnTm9kZVtdKS5wdXNoKGRlYnVnTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgcHJvcGVydHkgYmluZGluZ3MgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgZ2VuZXJhdGVzXG4gKiBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byB2YWx1ZXMuIFRoaXMgbWFwIG9ubHkgY29udGFpbnMgcHJvcGVydHkgYmluZGluZ3NcbiAqIGRlZmluZWQgaW4gdGVtcGxhdGVzLCBub3QgaW4gaG9zdCBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gY29sbGVjdFByb3BlcnR5QmluZGluZ3MoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHREYXRhOiBURGF0YSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgY29uc3QgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgbGV0IGJpbmRpbmdJbmRleCA9IGdldEZpcnN0QmluZGluZ0luZGV4KHROb2RlLnByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4LCB0RGF0YSk7XG5cbiAgd2hpbGUgKGJpbmRpbmdJbmRleCA8IHROb2RlLnByb3BlcnR5TWV0YWRhdGFFbmRJbmRleCkge1xuICAgIGxldCB2YWx1ZTogYW55O1xuICAgIGxldCBwcm9wTWV0YWRhdGEgPSB0RGF0YVtiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICB3aGlsZSAoIWlzUHJvcE1ldGFkYXRhU3RyaW5nKHByb3BNZXRhZGF0YSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIGZvciBhbiBpbnRlcnBvbGF0aW9uLiBXZSBuZWVkIHRvIGJ1aWxkIHVwXG4gICAgICAvLyB0aGUgZnVsbCBpbnRlcnBvbGF0aW9uIGJ5IGNvbWJpbmluZyBydW50aW1lIHZhbHVlcyBpbiBMVmlldyB3aXRoXG4gICAgICAvLyB0aGUgc3RhdGljIGludGVyc3RpdGlhbCB2YWx1ZXMgc3RvcmVkIGluIFREYXRhLlxuICAgICAgdmFsdWUgPSAodmFsdWUgfHwgJycpICsgcmVuZGVyU3RyaW5naWZ5KGxWaWV3W2JpbmRpbmdJbmRleF0pICsgdERhdGFbYmluZGluZ0luZGV4XTtcbiAgICAgIHByb3BNZXRhZGF0YSA9IHREYXRhWysrYmluZGluZ0luZGV4XSBhcyBzdHJpbmc7XG4gICAgfVxuICAgIHZhbHVlID0gdmFsdWUgPT09IHVuZGVmaW5lZCA/IGxWaWV3W2JpbmRpbmdJbmRleF0gOiB2YWx1ZSArPSBsVmlld1tiaW5kaW5nSW5kZXhdO1xuICAgIC8vIFByb3BlcnR5IG1ldGFkYXRhIHN0cmluZyBoYXMgMyBwYXJ0czogcHJvcGVydHkgbmFtZSwgcHJlZml4LCBhbmQgc3VmZml4XG4gICAgY29uc3QgbWV0YWRhdGFQYXJ0cyA9IHByb3BNZXRhZGF0YS5zcGxpdChJTlRFUlBPTEFUSU9OX0RFTElNSVRFUik7XG4gICAgY29uc3QgcHJvcGVydHlOYW1lID0gbWV0YWRhdGFQYXJ0c1swXTtcbiAgICAvLyBBdHRyIGJpbmRpbmdzIGRvbid0IGhhdmUgcHJvcGVydHkgbmFtZXMgYW5kIHNob3VsZCBiZSBza2lwcGVkXG4gICAgaWYgKHByb3BlcnR5TmFtZSkge1xuICAgICAgLy8gV3JhcCB2YWx1ZSB3aXRoIHByZWZpeCBhbmQgc3VmZml4ICh3aWxsIGJlICcnIGZvciBub3JtYWwgYmluZGluZ3MpLCBpZiB0aGV5J3JlIGRlZmluZWQuXG4gICAgICAvLyBBdm9pZCB3cmFwcGluZyBmb3Igbm9ybWFsIGJpbmRpbmdzIHNvIHRoYXQgdGhlIHZhbHVlIGRvZXNuJ3QgZ2V0IGNhc3QgdG8gYSBzdHJpbmcuXG4gICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSAobWV0YWRhdGFQYXJ0c1sxXSAmJiBtZXRhZGF0YVBhcnRzWzJdKSA/XG4gICAgICAgICAgbWV0YWRhdGFQYXJ0c1sxXSArIHZhbHVlICsgbWV0YWRhdGFQYXJ0c1syXSA6XG4gICAgICAgICAgdmFsdWU7XG4gICAgfVxuICAgIGJpbmRpbmdJbmRleCsrO1xuICB9XG4gIHJldHVybiBwcm9wZXJ0aWVzO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgZmlyc3QgYmluZGluZyBpbmRleCB0aGF0IGhvbGRzIHZhbHVlcyBmb3IgdGhpcyBwcm9wZXJ0eVxuICogYmluZGluZy5cbiAqXG4gKiBGb3Igbm9ybWFsIGJpbmRpbmdzIChlLmcuIGBbaWRdPVwiaWRcImApLCB0aGUgYmluZGluZyBpbmRleCBpcyB0aGVcbiAqIHNhbWUgYXMgdGhlIG1ldGFkYXRhIGluZGV4LiBGb3IgaW50ZXJwb2xhdGlvbnMgKGUuZy4gYGlkPVwie3tpZH19LXt7bmFtZX19XCJgKSxcbiAqIHRoZXJlIGNhbiBiZSBtdWx0aXBsZSBiaW5kaW5nIHZhbHVlcywgc28gd2UgbWlnaHQgaGF2ZSB0byBsb29wIGJhY2t3YXJkc1xuICogZnJvbSB0aGUgbWV0YWRhdGEgaW5kZXggdW50aWwgd2UgZmluZCB0aGUgZmlyc3Qgb25lLlxuICpcbiAqIEBwYXJhbSBtZXRhZGF0YUluZGV4IFRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvcGVydHkgbWV0YWRhdGEgc3RyaW5nIGZvclxuICogdGhpcyBub2RlLlxuICogQHBhcmFtIHREYXRhIFRoZSBkYXRhIGFycmF5IGZvciB0aGUgY3VycmVudCBUVmlld1xuICogQHJldHVybnMgVGhlIGZpcnN0IGJpbmRpbmcgaW5kZXggZm9yIHRoaXMgYmluZGluZ1xuICovXG5mdW5jdGlvbiBnZXRGaXJzdEJpbmRpbmdJbmRleChtZXRhZGF0YUluZGV4OiBudW1iZXIsIHREYXRhOiBURGF0YSk6IG51bWJlciB7XG4gIGxldCBjdXJyZW50QmluZGluZ0luZGV4ID0gbWV0YWRhdGFJbmRleCAtIDE7XG5cbiAgLy8gSWYgdGhlIHNsb3QgYmVmb3JlIHRoZSBtZXRhZGF0YSBob2xkcyBhIHN0cmluZywgd2Uga25vdyB0aGF0IHRoaXNcbiAgLy8gbWV0YWRhdGEgYXBwbGllcyB0byBhbiBpbnRlcnBvbGF0aW9uIHdpdGggYXQgbGVhc3QgMiBiaW5kaW5ncywgYW5kXG4gIC8vIHdlIG5lZWQgdG8gc2VhcmNoIGZ1cnRoZXIgdG8gYWNjZXNzIHRoZSBmaXJzdCBiaW5kaW5nIHZhbHVlLlxuICBsZXQgY3VycmVudFZhbHVlID0gdERhdGFbY3VycmVudEJpbmRpbmdJbmRleF07XG5cbiAgLy8gV2UgbmVlZCB0byBpdGVyYXRlIHVudGlsIHdlIGhpdCBlaXRoZXIgYTpcbiAgLy8gLSBUTm9kZSAoaXQgaXMgYW4gZWxlbWVudCBzbG90IG1hcmtpbmcgdGhlIGVuZCBvZiBgY29uc3RzYCBzZWN0aW9uKSwgT1IgYVxuICAvLyAtIG1ldGFkYXRhIHN0cmluZyAoc2xvdCBpcyBhdHRyaWJ1dGUgbWV0YWRhdGEgb3IgYSBwcmV2aW91cyBub2RlJ3MgcHJvcGVydHkgbWV0YWRhdGEpXG4gIHdoaWxlICh0eXBlb2YgY3VycmVudFZhbHVlID09PSAnc3RyaW5nJyAmJiAhaXNQcm9wTWV0YWRhdGFTdHJpbmcoY3VycmVudFZhbHVlKSkge1xuICAgIGN1cnJlbnRWYWx1ZSA9IHREYXRhWy0tY3VycmVudEJpbmRpbmdJbmRleF07XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnRCaW5kaW5nSW5kZXggKyAxO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0SG9zdFByb3BlcnR5QmluZGluZ3MoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHREYXRhOiBURGF0YSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgY29uc3QgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcblxuICAvLyBIb3N0IGJpbmRpbmcgdmFsdWVzIGZvciBhIG5vZGUgYXJlIHN0b3JlZCBhZnRlciBkaXJlY3RpdmVzIG9uIHRoYXQgbm9kZVxuICBsZXQgaG9zdFByb3BJbmRleCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgbGV0IHByb3BNZXRhZGF0YSA9IHREYXRhW2hvc3RQcm9wSW5kZXhdIGFzIGFueTtcblxuICAvLyBXaGVuIHdlIHJlYWNoIGEgdmFsdWUgaW4gVFZpZXcuZGF0YSB0aGF0IGlzIG5vdCBhIHN0cmluZywgd2Uga25vdyB3ZSd2ZVxuICAvLyBoaXQgdGhlIG5leHQgbm9kZSdzIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBhbmQgc2hvdWxkIHN0b3AgY29weWluZyBkYXRhLlxuICB3aGlsZSAodHlwZW9mIHByb3BNZXRhZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBwcm9wTWV0YWRhdGEuc3BsaXQoSU5URVJQT0xBVElPTl9ERUxJTUlURVIpWzBdO1xuICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IGxWaWV3W2hvc3RQcm9wSW5kZXhdO1xuICAgIHByb3BNZXRhZGF0YSA9IHREYXRhWysraG9zdFByb3BJbmRleF07XG4gIH1cbiAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cblxuZnVuY3Rpb24gY29sbGVjdENsYXNzTmFtZXMoZGVidWdFbGVtZW50OiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsYXNzZXMgPSBkZWJ1Z0VsZW1lbnQuY2xhc3NlcztcbiAgbGV0IG91dHB1dCA9ICcnO1xuXG4gIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIE9iamVjdC5rZXlzKGNsYXNzZXMpKSB7XG4gICAgaWYgKGNsYXNzZXNbY2xhc3NOYW1lXSkge1xuICAgICAgb3V0cHV0ID0gb3V0cHV0ID8gb3V0cHV0ICsgYCAke2NsYXNzTmFtZX1gIDogY2xhc3NOYW1lO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuLy8gTmVlZCB0byBrZWVwIHRoZSBub2RlcyBpbiBhIGdsb2JhbCBNYXAgc28gdGhhdCBtdWx0aXBsZSBhbmd1bGFyIGFwcHMgYXJlIHN1cHBvcnRlZC5cbmNvbnN0IF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUgPSBuZXcgTWFwPGFueSwgRGVidWdOb2RlPigpO1xuXG5mdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BSRV9SM19fKG5hdGl2ZU5vZGU6IGFueSk6IERlYnVnTm9kZXxudWxsIHtcbiAgcmV0dXJuIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuZ2V0KG5hdGl2ZU5vZGUpIHx8IG51bGw7XG59XG5cbmNvbnN0IE5HX0RFQlVHX1BST1BFUlRZID0gJ19fbmdfZGVidWdfXyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBFbGVtZW50KTogRGVidWdFbGVtZW50X19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogTm9kZSk6IERlYnVnTm9kZV9fUE9TVF9SM19fO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IG51bGwpOiBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IGFueSk6IERlYnVnTm9kZXxudWxsIHtcbiAgaWYgKG5hdGl2ZU5vZGUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKCEobmF0aXZlTm9kZS5oYXNPd25Qcm9wZXJ0eShOR19ERUJVR19QUk9QRVJUWSkpKSB7XG4gICAgICAobmF0aXZlTm9kZSBhcyBhbnkpW05HX0RFQlVHX1BST1BFUlRZXSA9IG5hdGl2ZU5vZGUubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUgP1xuICAgICAgICAgIG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhuYXRpdmVOb2RlIGFzIEVsZW1lbnQpIDpcbiAgICAgICAgICBuZXcgRGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZSk7XG4gICAgfVxuICAgIHJldHVybiAobmF0aXZlTm9kZSBhcyBhbnkpW05HX0RFQlVHX1BST1BFUlRZXTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBnZXREZWJ1Z05vZGU6IChuYXRpdmVOb2RlOiBhbnkpID0+IERlYnVnTm9kZSB8IG51bGwgPSBnZXREZWJ1Z05vZGVfX1BSRV9SM19fO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsRGVidWdOb2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUudmFsdWVzKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhEZWJ1Z05vZGUobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuc2V0KG5vZGUubmF0aXZlTm9kZSwgbm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEZWJ1Z05vZGVGcm9tSW5kZXgobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuZGVsZXRlKG5vZGUubmF0aXZlTm9kZSk7XG59XG5cbi8qKlxuICogQSBib29sZWFuLXZhbHVlZCBmdW5jdGlvbiBvdmVyIGEgdmFsdWUsIHBvc3NpYmx5IGluY2x1ZGluZyBjb250ZXh0IGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgdGhhdCB2YWx1ZSdzIHBvc2l0aW9uIGluIGFuIGFycmF5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcmVkaWNhdGU8VD4geyAodmFsdWU6IFQpOiBib29sZWFuOyB9XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdOb2RlOiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnTm9kZX0gPSBEZWJ1Z05vZGVfX1BSRV9SM19fO1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnRWxlbWVudDoge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z0VsZW1lbnR9ID0gRGVidWdFbGVtZW50X19QUkVfUjNfXztcbiJdfQ==