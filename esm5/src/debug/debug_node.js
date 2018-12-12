import * as tslib_1 from "tslib";
import { assertDomNode } from '../render3/assert';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext, loadLContextFromNode } from '../render3/discovery_utils';
import { TVIEW } from '../render3/interfaces/view';
import { getProp, getValue, isClassBased } from '../render3/styling/class_and_style_bindings';
import { getStylingContext } from '../render3/styling/util';
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
function notImplemented() {
    throw new Error('Missing proper ivy implementation.');
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
        get: function () {
            var context = loadLContext(this.nativeNode);
            var lView = context.lView;
            var tView = lView[TVIEW];
            var tNode = tView.data[context.nodeIndex];
            var properties = {};
            // TODO: https://angular-team.atlassian.net/browse/FW-681
            // Missing implementation here...
            return properties;
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
                var lNode = lContext.lView[lContext.nodeIndex];
                var stylingContext = getStylingContext(lContext.nodeIndex, lContext.lView);
                if (stylingContext) {
                    for (var i = 8 /* SingleStylesStartPosition */; i < lNode.length; i += 4 /* Size */) {
                        if (isClassBased(lNode, i)) {
                            var className = getProp(lNode, i);
                            var value = getValue(lNode, i);
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
                var lNode = lContext.lView[lContext.nodeIndex];
                var stylingContext = getStylingContext(lContext.nodeIndex, lContext.lView);
                if (stylingContext) {
                    for (var i = 8 /* SingleStylesStartPosition */; i < lNode.length; i += 4 /* Size */) {
                        if (!isClassBased(lNode, i)) {
                            var styleName = getProp(lNode, i);
                            var value = getValue(lNode, i);
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
export var getDebugNode = getDebugNode__POST_R3__;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFHdEwsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ2pELE9BQU8sRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBQyxNQUFNLDZDQUE2QyxDQUFDO0FBQzVGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRzFEO0lBQ0UsdUJBQW1CLElBQVksRUFBUyxRQUFrQjtRQUF2QyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBVTtJQUFHLENBQUM7SUFDaEUsb0JBQUM7QUFBRCxDQUFDLEFBRkQsSUFFQzs7QUFlRDtJQU1FLDZCQUFZLFVBQWUsRUFBRSxNQUFzQixFQUFFLGFBQTJCO1FBTHZFLGNBQVMsR0FBb0IsRUFBRSxDQUFDO1FBQ2hDLFdBQU0sR0FBc0IsSUFBSSxDQUFDO1FBS3hDLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1FBQ25DLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksTUFBTSxJQUFJLE1BQU0sWUFBWSxzQkFBc0IsRUFBRTtZQUN0RCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZCO0lBQ0gsQ0FBQztJQUVELHNCQUFJLHlDQUFRO2FBQVosY0FBMkIsT0FBTyxJQUFJLENBQUMsYUFBYSxD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LEtBQUssQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxJQUFlO0lBQzVDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsSUFBZTtJQUN0RCxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFVRDs7R0FFRztBQUNILE1BQU0sQ0FBQyxJQUFNLFNBQVMsR0FBc0MsbUJBQTBCLENBQUM7QUFFdkY7O0dBRUc7QUFDSCxNQUFNLENBQUMsSUFBTSxZQUFZLEdBQXlDLHNCQUE2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50LCBnZXRDb250ZXh0LCBnZXRJbmplY3Rpb25Ub2tlbnMsIGdldEluamVjdG9yLCBnZXRMaXN0ZW5lcnMsIGdldExvY2FsUmVmcywgaXNCcm93c2VyRXZlbnRzLCBsb2FkTENvbnRleHQsIGxvYWRMQ29udGV4dEZyb21Ob2RlfSBmcm9tICcuLi9yZW5kZXIzL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1N0eWxpbmdJbmRleH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtUVklFV30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRQcm9wLCBnZXRWYWx1ZSwgaXNDbGFzc0Jhc2VkfSBmcm9tICcuLi9yZW5kZXIzL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0U3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3JlbmRlcjMvc3R5bGluZy91dGlsJztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3L2luZGV4JztcblxuZXhwb3J0IGNsYXNzIEV2ZW50TGlzdGVuZXIge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgY2FsbGJhY2s6IEZ1bmN0aW9uKSB7fVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGUge1xuICByZWFkb25seSBsaXN0ZW5lcnM6IEV2ZW50TGlzdGVuZXJbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICByZWFkb25seSBpbmplY3RvcjogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IGNvbXBvbmVudEluc3RhbmNlOiBhbnk7XG4gIHJlYWRvbmx5IGNvbnRleHQ6IGFueTtcbiAgcmVhZG9ubHkgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IHByb3ZpZGVyVG9rZW5zOiBhbnlbXTtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z05vZGVfX1BSRV9SM19fIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBFdmVudExpc3RlbmVyW10gPSBbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQ7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogYW55LCBwYXJlbnQ6IERlYnVnTm9kZXxudWxsLCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBfZGVidWdDb250ZXh0O1xuICAgIHRoaXMubmF0aXZlTm9kZSA9IG5hdGl2ZU5vZGU7XG4gICAgaWYgKHBhcmVudCAmJiBwYXJlbnQgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBwYXJlbnQuYWRkQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5pbmplY3RvcjsgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbXBvbmVudDsgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29udGV4dDsgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5yZWZlcmVuY2VzOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5wcm92aWRlclRva2VuczsgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z0VsZW1lbnQgZXh0ZW5kcyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdO1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG4gIHJlYWRvbmx5IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXTtcblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50O1xuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W107XG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdO1xuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZDtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fIGV4dGVuZHMgRGVidWdOb2RlX19QUkVfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIHJlYWRvbmx5IG5hbWUgITogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIHJlYWRvbmx5IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogYW55LCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICBzdXBlcihuYXRpdmVOb2RlLCBwYXJlbnQsIF9kZWJ1Z0NvbnRleHQpO1xuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZU5vZGU7XG4gIH1cblxuICBhZGRDaGlsZChjaGlsZDogRGVidWdOb2RlKSB7XG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMucHVzaChjaGlsZCk7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUNoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBjb25zdCBjaGlsZEluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChjaGlsZEluZGV4ICE9PSAtMSkge1xuICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlIHwgbnVsbH0pLnBhcmVudCA9IG51bGw7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKGNoaWxkSW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydENoaWxkcmVuQWZ0ZXIoY2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGRyZW46IERlYnVnTm9kZVtdKSB7XG4gICAgY29uc3Qgc2libGluZ0luZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChzaWJsaW5nSW5kZXggIT09IC0xKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHNpYmxpbmdJbmRleCArIDEsIDAsIC4uLm5ld0NoaWxkcmVuKTtcbiAgICAgIG5ld0NoaWxkcmVuLmZvckVhY2goYyA9PiB7XG4gICAgICAgIGlmIChjLnBhcmVudCkge1xuICAgICAgICAgIChjLnBhcmVudCBhcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKS5yZW1vdmVDaGlsZChjKTtcbiAgICAgICAgfVxuICAgICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0QmVmb3JlKHJlZkNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkOiBEZWJ1Z05vZGUpOiB2b2lkIHtcbiAgICBjb25zdCByZWZJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKHJlZkNoaWxkKTtcbiAgICBpZiAocmVmSW5kZXggPT09IC0xKSB7XG4gICAgICB0aGlzLmFkZENoaWxkKG5ld0NoaWxkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5ld0NoaWxkLnBhcmVudCkge1xuICAgICAgICAobmV3Q2hpbGQucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKG5ld0NoaWxkKTtcbiAgICAgIH1cbiAgICAgIChuZXdDaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHJlZkluZGV4LCAwLCBuZXdDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzXG4gICAgICAgIC5jaGlsZE5vZGVzICAvL1xuICAgICAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykgYXMgRGVidWdFbGVtZW50W107XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09IGV2ZW50TmFtZSkge1xuICAgICAgICBsaXN0ZW5lci5jYWxsYmFjayhldmVudE9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc05hdGl2ZUVsZW1lbnRzKGRlYnVnRWxzOiBEZWJ1Z0VsZW1lbnRbXSk6IGFueSB7XG4gIHJldHVybiBkZWJ1Z0Vscy5tYXAoKGVsKSA9PiBlbC5uYXRpdmVFbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5RWxlbWVudENoaWxkcmVuKFxuICAgIGVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10pIHtcbiAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbihcbiAgICBwYXJlbnROb2RlOiBEZWJ1Z05vZGUsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdKSB7XG4gIGlmIChwYXJlbnROb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgIHBhcmVudE5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm90SW1wbGVtZW50ZWQoKTogRXJyb3Ige1xuICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgcHJvcGVyIGl2eSBpbXBsZW1lbnRhdGlvbi4nKTtcbn1cblxuY2xhc3MgRGVidWdOb2RlX19QT1NUX1IzX18gaW1wbGVtZW50cyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBOb2RlO1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IE5vZGUpIHsgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTsgfVxuXG4gIGdldCBwYXJlbnQoKTogRGVidWdFbGVtZW50fG51bGwge1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubmF0aXZlTm9kZS5wYXJlbnROb2RlIGFzIEVsZW1lbnQ7XG4gICAgcmV0dXJuIHBhcmVudCA/IG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhwYXJlbnQpIDogbnVsbDtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBnZXRJbmplY3Rvcih0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlTm9kZTtcbiAgICByZXR1cm4gbmF0aXZlRWxlbWVudCAmJiBnZXRDb21wb25lbnQobmF0aXZlRWxlbWVudCBhcyBFbGVtZW50KTtcbiAgfVxuICBnZXQgY29udGV4dCgpOiBhbnkgeyByZXR1cm4gZ2V0Q29udGV4dCh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7IH1cblxuICBnZXQgbGlzdGVuZXJzKCk6IEV2ZW50TGlzdGVuZXJbXSB7XG4gICAgcmV0dXJuIGdldExpc3RlbmVycyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCkuZmlsdGVyKGlzQnJvd3NlckV2ZW50cyk7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55O30geyByZXR1cm4gZ2V0TG9jYWxSZWZzKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gZ2V0SW5qZWN0aW9uVG9rZW5zKHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTsgfVxufVxuXG5jbGFzcyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUE9TVF9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogRWxlbWVudCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKG5hdGl2ZU5vZGUpO1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUpO1xuICB9XG5cbiAgZ2V0IG5hdGl2ZUVsZW1lbnQoKTogRWxlbWVudHxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID8gdGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQgOiBudWxsO1xuICB9XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMubmF0aXZlRWxlbWVudCAhLm5vZGVOYW1lOyB9XG5cbiAgZ2V0IHByb3BlcnRpZXMoKToge1trZXk6IHN0cmluZ106IGFueTt9IHtcbiAgICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KHRoaXMubmF0aXZlTm9kZSkgITtcbiAgICBjb25zdCBsVmlldyA9IGNvbnRleHQubFZpZXc7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgICBjb25zdCBwcm9wZXJ0aWVzID0ge307XG4gICAgLy8gVE9ETzogaHR0cHM6Ly9hbmd1bGFyLXRlYW0uYXRsYXNzaWFuLm5ldC9icm93c2UvRlctNjgxXG4gICAgLy8gTWlzc2luZyBpbXBsZW1lbnRhdGlvbiBoZXJlLi4uXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH1cblxuICBnZXQgYXR0cmlidXRlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgZUF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgYXR0ciA9IGVBdHRyc1tpXTtcbiAgICAgICAgYXR0cmlidXRlc1thdHRyLm5hbWVdID0gYXR0ci52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gIH1cblxuICBnZXQgY2xhc3NlcygpOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9IHtcbiAgICBjb25zdCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KTtcbiAgICAgIGNvbnN0IGxOb2RlID0gbENvbnRleHQubFZpZXdbbENvbnRleHQubm9kZUluZGV4XTtcbiAgICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQobENvbnRleHQubm9kZUluZGV4LCBsQ29udGV4dC5sVmlldyk7XG4gICAgICBpZiAoc3R5bGluZ0NvbnRleHQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgbE5vZGUubGVuZ3RoO1xuICAgICAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgICAgICBpZiAoaXNDbGFzc0Jhc2VkKGxOb2RlLCBpKSkge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gZ2V0UHJvcChsTm9kZSwgaSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKGxOb2RlLCBpKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gaWdub3JlIGBudWxsYCBzaW5jZSB0aG9zZSBkb24ndCBvdmVyd3JpdGUgdGhlIHZhbHVlcy5cbiAgICAgICAgICAgICAgY2xhc3Nlc1tjbGFzc05hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjaywganVzdCByZWFkIERPTS5cbiAgICAgICAgY29uc3QgZUNsYXNzZXMgPSBlbGVtZW50LmNsYXNzTGlzdDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQ2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNsYXNzZXNbZUNsYXNzZXNbaV1dID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xhc3NlcztcbiAgfVxuXG4gIGdldCBzdHlsZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgY29uc3Qgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KTtcbiAgICAgIGNvbnN0IGxOb2RlID0gbENvbnRleHQubFZpZXdbbENvbnRleHQubm9kZUluZGV4XTtcbiAgICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQobENvbnRleHQubm9kZUluZGV4LCBsQ29udGV4dC5sVmlldyk7XG4gICAgICBpZiAoc3R5bGluZ0NvbnRleHQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgbE5vZGUubGVuZ3RoO1xuICAgICAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgICAgICBpZiAoIWlzQ2xhc3NCYXNlZChsTm9kZSwgaSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlTmFtZSA9IGdldFByb3AobE5vZGUsIGkpO1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShsTm9kZSwgaSkgYXMgc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAvLyB3ZSB3YW50IHRvIGlnbm9yZSBgbnVsbGAgc2luY2UgdGhvc2UgZG9uJ3Qgb3ZlcndyaXRlIHRoZSB2YWx1ZXMuXG4gICAgICAgICAgICAgIHN0eWxlc1tzdHlsZU5hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjaywganVzdCByZWFkIERPTS5cbiAgICAgICAgY29uc3QgZVN0eWxlcyA9IChlbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlU3R5bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IGVTdHlsZXMuaXRlbShpKTtcbiAgICAgICAgICBzdHlsZXNbbmFtZV0gPSBlU3R5bGVzLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0eWxlcztcbiAgfVxuXG4gIGdldCBjaGlsZE5vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gdGhpcy5uYXRpdmVOb2RlLmNoaWxkTm9kZXM7XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnTm9kZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCFuYXRpdmVFbGVtZW50KSByZXR1cm4gW107XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IG5hdGl2ZUVsZW1lbnQuY2hpbGRyZW47XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCB0cnVlKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZmFsc2UpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBpZiAobGlzdGVuZXIubmFtZSA9PT0gZXZlbnROYW1lKSB7XG4gICAgICAgIGxpc3RlbmVyLmNhbGxiYWNrKGV2ZW50T2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICBwYXJlbnROb2RlOiBEZWJ1Z05vZGUsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogYm9vbGVhbikge1xuICBpZiAocGFyZW50Tm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUE9TVF9SM19fKSB7XG4gICAgcGFyZW50Tm9kZS5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QT1NUX1IzX18pIHtcbiAgICAgICAgaWYgKGVsZW1lbnRzT25seSA/IG5vZGUubmF0aXZlRWxlbWVudCA6IHRydWUpIHtcbiAgICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5cbi8vIE5lZWQgdG8ga2VlcCB0aGUgbm9kZXMgaW4gYSBnbG9iYWwgTWFwIHNvIHRoYXQgbXVsdGlwbGUgYW5ndWxhciBhcHBzIGFyZSBzdXBwb3J0ZWQuXG5jb25zdCBfbmF0aXZlTm9kZVRvRGVidWdOb2RlID0gbmV3IE1hcDxhbnksIERlYnVnTm9kZT4oKTtcblxuZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QUkVfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIHJldHVybiBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmdldChuYXRpdmVOb2RlKSB8fCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogRWxlbWVudCk6IERlYnVnRWxlbWVudF9fUE9TVF9SM19fO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IE5vZGUpOiBEZWJ1Z05vZGVfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBudWxsKTogbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIGlmIChuYXRpdmVOb2RlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIHJldHVybiBuYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID9cbiAgICAgICAgbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKG5hdGl2ZU5vZGUgYXMgRWxlbWVudCkgOlxuICAgICAgICBuZXcgRGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZ2V0RGVidWdOb2RlOiAobmF0aXZlTm9kZTogYW55KSA9PiBEZWJ1Z05vZGUgfCBudWxsID0gZ2V0RGVidWdOb2RlX19QUkVfUjNfXztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbERlYnVnTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnZhbHVlcygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4RGVidWdOb2RlKG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnNldChub2RlLm5hdGl2ZU5vZGUsIG5vZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4KG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmRlbGV0ZShub2RlLm5hdGl2ZU5vZGUpO1xufVxuXG4vKipcbiAqIEEgYm9vbGVhbi12YWx1ZWQgZnVuY3Rpb24gb3ZlciBhIHZhbHVlLCBwb3NzaWJseSBpbmNsdWRpbmcgY29udGV4dCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIHRoYXQgdmFsdWUncyBwb3NpdGlvbiBpbiBhbiBhcnJheS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJlZGljYXRlPFQ+IHsgKHZhbHVlOiBUKTogYm9vbGVhbjsgfVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnTm9kZToge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z05vZGV9ID0gRGVidWdOb2RlX19QUkVfUjNfXyBhcyBhbnk7XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdFbGVtZW50OiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnRWxlbWVudH0gPSBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fIGFzIGFueTtcbiJdfQ==