/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext, loadLContextFromNode } from '../render3/discovery_utils';
import { TVIEW } from '../render3/interfaces/view';
import { getProp, getValue, isClassBasedValue } from '../render3/styling/class_and_style_bindings';
import { getStylingContext } from '../render3/styling/util';
import { INTERPOLATION_DELIMITER, isPropMetadataString, renderStringify } from '../render3/util';
import { assertDomNode } from '../util/assert';
var EventListener = /** @class */ (function () {
    function EventListener(name, callback) {
        this.name = name;
        this.callback = callback;
    }
    return EventListener;
}());
export { EventListener };
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
            return nativeElement && getComponent(nativeElement);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "context", {
        get: function () { return getContext(this.nativeNode); },
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
            return tslib_1.__assign({}, properties, hostProperties);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "attributes", {
        get: function () {
            var attributes = {};
            var element = this.nativeElement;
            if (element) {
                var eAttrs = element.attributes;
                for (var i = 0; i < eAttrs.length; i++) {
                    var attr = eAttrs[i];
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
                var stylingContext = getStylingContext(lContext.nodeIndex, lContext.lView);
                if (stylingContext) {
                    for (var i = 9 /* SingleStylesStartPosition */; i < stylingContext.length; i += 4 /* Size */) {
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
                var stylingContext = getStylingContext(lContext.nodeIndex, lContext.lView);
                if (stylingContext) {
                    for (var i = 9 /* SingleStylesStartPosition */; i < stylingContext.length; i += 4 /* Size */) {
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
        _queryNodeChildrenR3(this, predicate, matches, true);
        return matches;
    };
    DebugElement__POST_R3__.prototype.queryAllNodes = function (predicate) {
        var matches = [];
        _queryNodeChildrenR3(this, predicate, matches, false);
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
function _queryNodeChildrenR3(parentNode, predicate, matches, elementsOnly) {
    if (parentNode instanceof DebugElement__POST_R3__) {
        parentNode.childNodes.forEach(function (node) {
            if (predicate(node)) {
                matches.push(node);
            }
            if (node instanceof DebugElement__POST_R3__) {
                if (elementsOnly ? node.nativeElement : true) {
                    _queryNodeChildrenR3(node, predicate, matches, elementsOnly);
                }
            }
        });
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
        var value = '';
        var propMetadata = tData[bindingIndex];
        while (!isPropMetadataString(propMetadata)) {
            // This is the first value for an interpolation. We need to build up
            // the full interpolation by combining runtime values in LView with
            // the static interstitial values stored in TData.
            value += renderStringify(lView[bindingIndex]) + tData[bindingIndex];
            propMetadata = tData[++bindingIndex];
        }
        value += lView[bindingIndex];
        // Property metadata string has 3 parts: property name, prefix, and suffix
        var metadataParts = propMetadata.split(INTERPOLATION_DELIMITER);
        var propertyName = metadataParts[0];
        // Attr bindings don't have property names and should be skipped
        if (propertyName) {
            // Wrap value with prefix and suffix (will be '' for normal bindings)
            properties[propertyName] = metadataParts[1] + value + metadataParts[2];
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
// Need to keep the nodes in a global Map so that multiple angular apps are supported.
var _nativeNodeToDebugNode = new Map();
function getDebugNode__PRE_R3__(nativeNode) {
    return _nativeNodeToDebugNode.get(nativeNode) || null;
}
export function getDebugNode__POST_R3__(nativeNode) {
    if (nativeNode instanceof Node) {
        return nativeNode.nodeType == Node.ELEMENT_NODE ?
            new DebugElement__POST_R3__(nativeNode) :
            new DebugNode__POST_R3__(nativeNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUdILE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUd0TCxPQUFPLEVBQWUsS0FBSyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDL0QsT0FBTyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSw2Q0FBNkMsQ0FBQztBQUNqRyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsb0JBQW9CLEVBQUUsZUFBZSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDL0YsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRzdDO0lBQ0UsdUJBQW1CLElBQVksRUFBUyxRQUFrQjtRQUF2QyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBVTtJQUFHLENBQUM7SUFDaEUsb0JBQUM7QUFBRCxDQUFDLEFBRkQsSUFFQzs7QUFlRDtJQU1FLDZCQUFZLFVBQWUsRUFBRSxNQUFzQixFQUFFLGFBQTJCO1FBTHZFLGNBQVMsR0FBb0IsRUFBRSxDQUFDO1FBQ2hDLFdBQU0sR0FBc0IsSUFBSSxDQUFDO1FBS3hDLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1FBQ25DLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksTUFBTSxJQUFJLE1BQU0sWUFBWSxzQkFBc0IsRUFB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VSxjQUFjLENBQUMsSUFBZTtJQUM1QyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUFDLElBQWU7SUFDdEQsc0JBQXNCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBVUQ7O0dBRUc7QUFDSCxNQUFNLENBQUMsSUFBTSxTQUFTLEdBQXNDLG1CQUEwQixDQUFDO0FBRXZGOztHQUVHO0FBQ0gsTUFBTSxDQUFDLElBQU0sWUFBWSxHQUF5QyxzQkFBNkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldEluamVjdGlvblRva2VucywgZ2V0SW5qZWN0b3IsIGdldExpc3RlbmVycywgZ2V0TG9jYWxSZWZzLCBpc0Jyb3dzZXJFdmVudHMsIGxvYWRMQ29udGV4dCwgbG9hZExDb250ZXh0RnJvbU5vZGV9IGZyb20gJy4uL3JlbmRlcjMvZGlzY292ZXJ5X3V0aWxzJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U3R5bGluZ0luZGV4fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0xWaWV3LCBURGF0YSwgVFZJRVd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0UHJvcCwgZ2V0VmFsdWUsIGlzQ2xhc3NCYXNlZFZhbHVlfSBmcm9tICcuLi9yZW5kZXIzL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0U3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3JlbmRlcjMvc3R5bGluZy91dGlsJztcbmltcG9ydCB7SU5URVJQT0xBVElPTl9ERUxJTUlURVIsIGlzUHJvcE1ldGFkYXRhU3RyaW5nLCByZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbCc7XG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3L2luZGV4JztcblxuZXhwb3J0IGNsYXNzIEV2ZW50TGlzdGVuZXIge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgY2FsbGJhY2s6IEZ1bmN0aW9uKSB7fVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGUge1xuICByZWFkb25seSBsaXN0ZW5lcnM6IEV2ZW50TGlzdGVuZXJbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICByZWFkb25seSBpbmplY3RvcjogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IGNvbXBvbmVudEluc3RhbmNlOiBhbnk7XG4gIHJlYWRvbmx5IGNvbnRleHQ6IGFueTtcbiAgcmVhZG9ubHkgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IHByb3ZpZGVyVG9rZW5zOiBhbnlbXTtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z05vZGVfX1BSRV9SM19fIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBFdmVudExpc3RlbmVyW10gPSBbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQ7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogYW55LCBwYXJlbnQ6IERlYnVnTm9kZXxudWxsLCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBfZGVidWdDb250ZXh0O1xuICAgIHRoaXMubmF0aXZlTm9kZSA9IG5hdGl2ZU5vZGU7XG4gICAgaWYgKHBhcmVudCAmJiBwYXJlbnQgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBwYXJlbnQuYWRkQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5pbmplY3RvcjsgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbXBvbmVudDsgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29udGV4dDsgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5yZWZlcmVuY2VzOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5wcm92aWRlclRva2VuczsgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z0VsZW1lbnQgZXh0ZW5kcyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdO1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG4gIHJlYWRvbmx5IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXTtcblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50O1xuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W107XG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdO1xuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZDtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fIGV4dGVuZHMgRGVidWdOb2RlX19QUkVfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIHJlYWRvbmx5IG5hbWUgITogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIHJlYWRvbmx5IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogYW55LCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICBzdXBlcihuYXRpdmVOb2RlLCBwYXJlbnQsIF9kZWJ1Z0NvbnRleHQpO1xuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZU5vZGU7XG4gIH1cblxuICBhZGRDaGlsZChjaGlsZDogRGVidWdOb2RlKSB7XG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMucHVzaChjaGlsZCk7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUNoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBjb25zdCBjaGlsZEluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChjaGlsZEluZGV4ICE9PSAtMSkge1xuICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlIHwgbnVsbH0pLnBhcmVudCA9IG51bGw7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKGNoaWxkSW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydENoaWxkcmVuQWZ0ZXIoY2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGRyZW46IERlYnVnTm9kZVtdKSB7XG4gICAgY29uc3Qgc2libGluZ0luZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChzaWJsaW5nSW5kZXggIT09IC0xKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHNpYmxpbmdJbmRleCArIDEsIDAsIC4uLm5ld0NoaWxkcmVuKTtcbiAgICAgIG5ld0NoaWxkcmVuLmZvckVhY2goYyA9PiB7XG4gICAgICAgIGlmIChjLnBhcmVudCkge1xuICAgICAgICAgIChjLnBhcmVudCBhcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKS5yZW1vdmVDaGlsZChjKTtcbiAgICAgICAgfVxuICAgICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0QmVmb3JlKHJlZkNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkOiBEZWJ1Z05vZGUpOiB2b2lkIHtcbiAgICBjb25zdCByZWZJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKHJlZkNoaWxkKTtcbiAgICBpZiAocmVmSW5kZXggPT09IC0xKSB7XG4gICAgICB0aGlzLmFkZENoaWxkKG5ld0NoaWxkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5ld0NoaWxkLnBhcmVudCkge1xuICAgICAgICAobmV3Q2hpbGQucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKG5ld0NoaWxkKTtcbiAgICAgIH1cbiAgICAgIChuZXdDaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHJlZkluZGV4LCAwLCBuZXdDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzXG4gICAgICAgIC5jaGlsZE5vZGVzICAvL1xuICAgICAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykgYXMgRGVidWdFbGVtZW50W107XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09IGV2ZW50TmFtZSkge1xuICAgICAgICBsaXN0ZW5lci5jYWxsYmFjayhldmVudE9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc05hdGl2ZUVsZW1lbnRzKGRlYnVnRWxzOiBEZWJ1Z0VsZW1lbnRbXSk6IGFueSB7XG4gIHJldHVybiBkZWJ1Z0Vscy5tYXAoKGVsKSA9PiBlbC5uYXRpdmVFbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5RWxlbWVudENoaWxkcmVuKFxuICAgIGVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10pIHtcbiAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbihcbiAgICBwYXJlbnROb2RlOiBEZWJ1Z05vZGUsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdKSB7XG4gIGlmIChwYXJlbnROb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgIHBhcmVudE5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbmNsYXNzIERlYnVnTm9kZV9fUE9TVF9SM19fIGltcGxlbWVudHMgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogTm9kZTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBOb2RlKSB7IHRoaXMubmF0aXZlTm9kZSA9IG5hdGl2ZU5vZGU7IH1cblxuICBnZXQgcGFyZW50KCk6IERlYnVnRWxlbWVudHxudWxsIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLm5hdGl2ZU5vZGUucGFyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgIHJldHVybiBwYXJlbnQgPyBuZXcgRGVidWdFbGVtZW50X19QT1NUX1IzX18ocGFyZW50KSA6IG51bGw7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gZ2V0SW5qZWN0b3IodGhpcy5uYXRpdmVOb2RlKTsgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB0aGlzLm5hdGl2ZU5vZGU7XG4gICAgcmV0dXJuIG5hdGl2ZUVsZW1lbnQgJiYgZ2V0Q29tcG9uZW50KG5hdGl2ZUVsZW1lbnQgYXMgRWxlbWVudCk7XG4gIH1cbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgcmV0dXJuIGdldENvbnRleHQodGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpOyB9XG5cbiAgZ2V0IGxpc3RlbmVycygpOiBFdmVudExpc3RlbmVyW10ge1xuICAgIHJldHVybiBnZXRMaXN0ZW5lcnModGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpLmZpbHRlcihpc0Jyb3dzZXJFdmVudHMpO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueTt9IHsgcmV0dXJuIGdldExvY2FsUmVmcyh0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIGdldEluamVjdGlvblRva2Vucyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7IH1cbn1cblxuY2xhc3MgRGVidWdFbGVtZW50X19QT1NUX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IEVsZW1lbnQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmVOb2RlKTtcbiAgICBzdXBlcihuYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBuYXRpdmVFbGVtZW50KCk6IEVsZW1lbnR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/IHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50IDogbnVsbDtcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLm5hdGl2ZUVsZW1lbnQgIS5ub2RlTmFtZTsgfVxuXG4gIC8qKlxuICAgKiAgR2V0cyBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byBwcm9wZXJ0eSB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqICBUaGlzIG1hcCBpbmNsdWRlczpcbiAgICogIC0gUmVndWxhciBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgW2lkXT1cImlkXCJgKVxuICAgKiAgLSBIb3N0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBob3N0OiB7ICdbaWRdJzogXCJpZFwiIH1gKVxuICAgKiAgLSBJbnRlcnBvbGF0ZWQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGlkPVwie3sgdmFsdWUgfX1cIilcbiAgICpcbiAgICogIEl0IGRvZXMgbm90IGluY2x1ZGU6XG4gICAqICAtIGlucHV0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbbXlDdXN0b21JbnB1dF09XCJ2YWx1ZVwiYClcbiAgICogIC0gYXR0cmlidXRlIGJpbmRpbmdzIChlLmcuIGBbYXR0ci5yb2xlXT1cIm1lbnVcImApXG4gICAqL1xuICBnZXQgcHJvcGVydGllcygpOiB7W2tleTogc3RyaW5nXTogYW55O30ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGhpcy5uYXRpdmVOb2RlKSAhO1xuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIGNvbnN0IHROb2RlID0gdERhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuXG4gICAgY29uc3QgcHJvcGVydGllcyA9IGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKHROb2RlLCBsVmlldywgdERhdGEpO1xuICAgIGNvbnN0IGhvc3RQcm9wZXJ0aWVzID0gY29sbGVjdEhvc3RQcm9wZXJ0eUJpbmRpbmdzKHROb2RlLCBsVmlldywgdERhdGEpO1xuICAgIHJldHVybiB7Li4ucHJvcGVydGllcywgLi4uaG9zdFByb3BlcnRpZXN9O1xuICB9XG5cbiAgZ2V0IGF0dHJpYnV0ZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgY29uc3QgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSA9IHt9O1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGVBdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGF0dHIgPSBlQXR0cnNbaV07XG4gICAgICAgIGF0dHJpYnV0ZXNbYXR0ci5uYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICB9XG5cbiAgZ2V0IGNsYXNzZXMoKToge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSB7XG4gICAgY29uc3QgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSA9IHt9O1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGxDb250ZXh0ID0gbG9hZExDb250ZXh0RnJvbU5vZGUoZWxlbWVudCk7XG4gICAgICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGxDb250ZXh0Lm5vZGVJbmRleCwgbENvbnRleHQubFZpZXcpO1xuICAgICAgaWYgKHN0eWxpbmdDb250ZXh0KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjsgaSA8IHN0eWxpbmdDb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgICAgaWYgKGlzQ2xhc3NCYXNlZFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSkge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gZ2V0UHJvcChzdHlsaW5nQ29udGV4dCwgaSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gaWdub3JlIGBudWxsYCBzaW5jZSB0aG9zZSBkb24ndCBvdmVyd3JpdGUgdGhlIHZhbHVlcy5cbiAgICAgICAgICAgICAgY2xhc3Nlc1tjbGFzc05hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjaywganVzdCByZWFkIERPTS5cbiAgICAgICAgY29uc3QgZUNsYXNzZXMgPSBlbGVtZW50LmNsYXNzTGlzdDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQ2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNsYXNzZXNbZUNsYXNzZXNbaV1dID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xhc3NlcztcbiAgfVxuXG4gIGdldCBzdHlsZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgY29uc3Qgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KTtcbiAgICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQobENvbnRleHQubm9kZUluZGV4LCBsQ29udGV4dC5sVmlldyk7XG4gICAgICBpZiAoc3R5bGluZ0NvbnRleHQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgc3R5bGluZ0NvbnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgICAgICBpZiAoIWlzQ2xhc3NCYXNlZFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSkge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGVOYW1lID0gZ2V0UHJvcChzdHlsaW5nQ29udGV4dCwgaSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gaWdub3JlIGBudWxsYCBzaW5jZSB0aG9zZSBkb24ndCBvdmVyd3JpdGUgdGhlIHZhbHVlcy5cbiAgICAgICAgICAgICAgc3R5bGVzW3N0eWxlTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrLCBqdXN0IHJlYWQgRE9NLlxuICAgICAgICBjb25zdCBlU3R5bGVzID0gKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVTdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gZVN0eWxlcy5pdGVtKGkpO1xuICAgICAgICAgIHN0eWxlc1tuYW1lXSA9IGVTdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3R5bGVzO1xuICB9XG5cbiAgZ2V0IGNoaWxkTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSB0aGlzLm5hdGl2ZU5vZGUuY2hpbGROb2RlcztcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdOb2RlW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoIW5hdGl2ZUVsZW1lbnQpIHJldHVybiBbXTtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gbmF0aXZlRWxlbWVudC5jaGlsZHJlbjtcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIHRydWUpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCBmYWxzZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZCB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09PSBldmVudE5hbWUpIHtcbiAgICAgICAgbGlzdGVuZXIuY2FsbGJhY2soZXZlbnRPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgIHBhcmVudE5vZGU6IERlYnVnTm9kZSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10sXG4gICAgZWxlbWVudHNPbmx5OiBib29sZWFuKSB7XG4gIGlmIChwYXJlbnROb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QT1NUX1IzX18pIHtcbiAgICBwYXJlbnROb2RlLmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXykge1xuICAgICAgICBpZiAoZWxlbWVudHNPbmx5ID8gbm9kZS5uYXRpdmVFbGVtZW50IDogdHJ1ZSkge1xuICAgICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgcHJvcGVydHkgYmluZGluZ3MgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgZ2VuZXJhdGVzXG4gKiBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byB2YWx1ZXMuIFRoaXMgbWFwIG9ubHkgY29udGFpbnMgcHJvcGVydHkgYmluZGluZ3NcbiAqIGRlZmluZWQgaW4gdGVtcGxhdGVzLCBub3QgaW4gaG9zdCBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gY29sbGVjdFByb3BlcnR5QmluZGluZ3MoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHREYXRhOiBURGF0YSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgY29uc3QgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgbGV0IGJpbmRpbmdJbmRleCA9IGdldEZpcnN0QmluZGluZ0luZGV4KHROb2RlLnByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4LCB0RGF0YSk7XG5cbiAgd2hpbGUgKGJpbmRpbmdJbmRleCA8IHROb2RlLnByb3BlcnR5TWV0YWRhdGFFbmRJbmRleCkge1xuICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgIGxldCBwcm9wTWV0YWRhdGEgPSB0RGF0YVtiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICB3aGlsZSAoIWlzUHJvcE1ldGFkYXRhU3RyaW5nKHByb3BNZXRhZGF0YSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIGZvciBhbiBpbnRlcnBvbGF0aW9uLiBXZSBuZWVkIHRvIGJ1aWxkIHVwXG4gICAgICAvLyB0aGUgZnVsbCBpbnRlcnBvbGF0aW9uIGJ5IGNvbWJpbmluZyBydW50aW1lIHZhbHVlcyBpbiBMVmlldyB3aXRoXG4gICAgICAvLyB0aGUgc3RhdGljIGludGVyc3RpdGlhbCB2YWx1ZXMgc3RvcmVkIGluIFREYXRhLlxuICAgICAgdmFsdWUgKz0gcmVuZGVyU3RyaW5naWZ5KGxWaWV3W2JpbmRpbmdJbmRleF0pICsgdERhdGFbYmluZGluZ0luZGV4XTtcbiAgICAgIHByb3BNZXRhZGF0YSA9IHREYXRhWysrYmluZGluZ0luZGV4XSBhcyBzdHJpbmc7XG4gICAgfVxuICAgIHZhbHVlICs9IGxWaWV3W2JpbmRpbmdJbmRleF07XG4gICAgLy8gUHJvcGVydHkgbWV0YWRhdGEgc3RyaW5nIGhhcyAzIHBhcnRzOiBwcm9wZXJ0eSBuYW1lLCBwcmVmaXgsIGFuZCBzdWZmaXhcbiAgICBjb25zdCBtZXRhZGF0YVBhcnRzID0gcHJvcE1ldGFkYXRhLnNwbGl0KElOVEVSUE9MQVRJT05fREVMSU1JVEVSKTtcbiAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBtZXRhZGF0YVBhcnRzWzBdO1xuICAgIC8vIEF0dHIgYmluZGluZ3MgZG9uJ3QgaGF2ZSBwcm9wZXJ0eSBuYW1lcyBhbmQgc2hvdWxkIGJlIHNraXBwZWRcbiAgICBpZiAocHJvcGVydHlOYW1lKSB7XG4gICAgICAvLyBXcmFwIHZhbHVlIHdpdGggcHJlZml4IGFuZCBzdWZmaXggKHdpbGwgYmUgJycgZm9yIG5vcm1hbCBiaW5kaW5ncylcbiAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IG1ldGFkYXRhUGFydHNbMV0gKyB2YWx1ZSArIG1ldGFkYXRhUGFydHNbMl07XG4gICAgfVxuICAgIGJpbmRpbmdJbmRleCsrO1xuICB9XG4gIHJldHVybiBwcm9wZXJ0aWVzO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgZmlyc3QgYmluZGluZyBpbmRleCB0aGF0IGhvbGRzIHZhbHVlcyBmb3IgdGhpcyBwcm9wZXJ0eVxuICogYmluZGluZy5cbiAqXG4gKiBGb3Igbm9ybWFsIGJpbmRpbmdzIChlLmcuIGBbaWRdPVwiaWRcImApLCB0aGUgYmluZGluZyBpbmRleCBpcyB0aGVcbiAqIHNhbWUgYXMgdGhlIG1ldGFkYXRhIGluZGV4LiBGb3IgaW50ZXJwb2xhdGlvbnMgKGUuZy4gYGlkPVwie3tpZH19LXt7bmFtZX19XCJgKSxcbiAqIHRoZXJlIGNhbiBiZSBtdWx0aXBsZSBiaW5kaW5nIHZhbHVlcywgc28gd2UgbWlnaHQgaGF2ZSB0byBsb29wIGJhY2t3YXJkc1xuICogZnJvbSB0aGUgbWV0YWRhdGEgaW5kZXggdW50aWwgd2UgZmluZCB0aGUgZmlyc3Qgb25lLlxuICpcbiAqIEBwYXJhbSBtZXRhZGF0YUluZGV4IFRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvcGVydHkgbWV0YWRhdGEgc3RyaW5nIGZvclxuICogdGhpcyBub2RlLlxuICogQHBhcmFtIHREYXRhIFRoZSBkYXRhIGFycmF5IGZvciB0aGUgY3VycmVudCBUVmlld1xuICogQHJldHVybnMgVGhlIGZpcnN0IGJpbmRpbmcgaW5kZXggZm9yIHRoaXMgYmluZGluZ1xuICovXG5mdW5jdGlvbiBnZXRGaXJzdEJpbmRpbmdJbmRleChtZXRhZGF0YUluZGV4OiBudW1iZXIsIHREYXRhOiBURGF0YSk6IG51bWJlciB7XG4gIGxldCBjdXJyZW50QmluZGluZ0luZGV4ID0gbWV0YWRhdGFJbmRleCAtIDE7XG5cbiAgLy8gSWYgdGhlIHNsb3QgYmVmb3JlIHRoZSBtZXRhZGF0YSBob2xkcyBhIHN0cmluZywgd2Uga25vdyB0aGF0IHRoaXNcbiAgLy8gbWV0YWRhdGEgYXBwbGllcyB0byBhbiBpbnRlcnBvbGF0aW9uIHdpdGggYXQgbGVhc3QgMiBiaW5kaW5ncywgYW5kXG4gIC8vIHdlIG5lZWQgdG8gc2VhcmNoIGZ1cnRoZXIgdG8gYWNjZXNzIHRoZSBmaXJzdCBiaW5kaW5nIHZhbHVlLlxuICBsZXQgY3VycmVudFZhbHVlID0gdERhdGFbY3VycmVudEJpbmRpbmdJbmRleF07XG5cbiAgLy8gV2UgbmVlZCB0byBpdGVyYXRlIHVudGlsIHdlIGhpdCBlaXRoZXIgYTpcbiAgLy8gLSBUTm9kZSAoaXQgaXMgYW4gZWxlbWVudCBzbG90IG1hcmtpbmcgdGhlIGVuZCBvZiBgY29uc3RzYCBzZWN0aW9uKSwgT1IgYVxuICAvLyAtIG1ldGFkYXRhIHN0cmluZyAoc2xvdCBpcyBhdHRyaWJ1dGUgbWV0YWRhdGEgb3IgYSBwcmV2aW91cyBub2RlJ3MgcHJvcGVydHkgbWV0YWRhdGEpXG4gIHdoaWxlICh0eXBlb2YgY3VycmVudFZhbHVlID09PSAnc3RyaW5nJyAmJiAhaXNQcm9wTWV0YWRhdGFTdHJpbmcoY3VycmVudFZhbHVlKSkge1xuICAgIGN1cnJlbnRWYWx1ZSA9IHREYXRhWy0tY3VycmVudEJpbmRpbmdJbmRleF07XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnRCaW5kaW5nSW5kZXggKyAxO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0SG9zdFByb3BlcnR5QmluZGluZ3MoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHREYXRhOiBURGF0YSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgY29uc3QgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcblxuICAvLyBIb3N0IGJpbmRpbmcgdmFsdWVzIGZvciBhIG5vZGUgYXJlIHN0b3JlZCBhZnRlciBkaXJlY3RpdmVzIG9uIHRoYXQgbm9kZVxuICBsZXQgaG9zdFByb3BJbmRleCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgbGV0IHByb3BNZXRhZGF0YSA9IHREYXRhW2hvc3RQcm9wSW5kZXhdIGFzIGFueTtcblxuICAvLyBXaGVuIHdlIHJlYWNoIGEgdmFsdWUgaW4gVFZpZXcuZGF0YSB0aGF0IGlzIG5vdCBhIHN0cmluZywgd2Uga25vdyB3ZSd2ZVxuICAvLyBoaXQgdGhlIG5leHQgbm9kZSdzIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBhbmQgc2hvdWxkIHN0b3AgY29weWluZyBkYXRhLlxuICB3aGlsZSAodHlwZW9mIHByb3BNZXRhZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBwcm9wTWV0YWRhdGEuc3BsaXQoSU5URVJQT0xBVElPTl9ERUxJTUlURVIpWzBdO1xuICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IGxWaWV3W2hvc3RQcm9wSW5kZXhdO1xuICAgIHByb3BNZXRhZGF0YSA9IHREYXRhWysraG9zdFByb3BJbmRleF07XG4gIH1cbiAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cblxuLy8gTmVlZCB0byBrZWVwIHRoZSBub2RlcyBpbiBhIGdsb2JhbCBNYXAgc28gdGhhdCBtdWx0aXBsZSBhbmd1bGFyIGFwcHMgYXJlIHN1cHBvcnRlZC5cbmNvbnN0IF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUgPSBuZXcgTWFwPGFueSwgRGVidWdOb2RlPigpO1xuXG5mdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BSRV9SM19fKG5hdGl2ZU5vZGU6IGFueSk6IERlYnVnTm9kZXxudWxsIHtcbiAgcmV0dXJuIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuZ2V0KG5hdGl2ZU5vZGUpIHx8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBFbGVtZW50KTogRGVidWdFbGVtZW50X19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogTm9kZSk6IERlYnVnTm9kZV9fUE9TVF9SM19fO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IG51bGwpOiBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IGFueSk6IERlYnVnTm9kZXxudWxsIHtcbiAgaWYgKG5hdGl2ZU5vZGUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgcmV0dXJuIG5hdGl2ZU5vZGUubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUgP1xuICAgICAgICBuZXcgRGVidWdFbGVtZW50X19QT1NUX1IzX18obmF0aXZlTm9kZSBhcyBFbGVtZW50KSA6XG4gICAgICAgIG5ldyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBnZXREZWJ1Z05vZGU6IChuYXRpdmVOb2RlOiBhbnkpID0+IERlYnVnTm9kZSB8IG51bGwgPSBnZXREZWJ1Z05vZGVfX1BSRV9SM19fO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsRGVidWdOb2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUudmFsdWVzKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhEZWJ1Z05vZGUobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuc2V0KG5vZGUubmF0aXZlTm9kZSwgbm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEZWJ1Z05vZGVGcm9tSW5kZXgobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuZGVsZXRlKG5vZGUubmF0aXZlTm9kZSk7XG59XG5cbi8qKlxuICogQSBib29sZWFuLXZhbHVlZCBmdW5jdGlvbiBvdmVyIGEgdmFsdWUsIHBvc3NpYmx5IGluY2x1ZGluZyBjb250ZXh0IGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgdGhhdCB2YWx1ZSdzIHBvc2l0aW9uIGluIGFuIGFycmF5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcmVkaWNhdGU8VD4geyAodmFsdWU6IFQpOiBib29sZWFuOyB9XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdOb2RlOiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnTm9kZX0gPSBEZWJ1Z05vZGVfX1BSRV9SM19fIGFzIGFueTtcblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z0VsZW1lbnQ6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdFbGVtZW50fSA9IERlYnVnRWxlbWVudF9fUFJFX1IzX18gYXMgYW55O1xuIl19