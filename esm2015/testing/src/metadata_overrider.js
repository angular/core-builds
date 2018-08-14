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
import { ɵstringify as stringify } from '@angular/core';
/** @typedef {?} */
var StringMap;
/** @type {?} */
let _nextReferenceId = 0;
export class MetadataOverrider {
    constructor() {
        this._references = new Map();
    }
    /**
     * Creates a new instance for the given metadata class
     * based on an old instance and overrides.
     * @template C, T
     * @param {?} metadataClass
     * @param {?} oldMetadata
     * @param {?} override
     * @return {?}
     */
    overrideMetadata(metadataClass, oldMetadata, override) {
        /** @type {?} */
        const props = {};
        if (oldMetadata) {
            _valueProps(oldMetadata).forEach((prop) => props[prop] = (/** @type {?} */ (oldMetadata))[prop]);
        }
        if (override.set) {
            if (override.remove || override.add) {
                throw new Error(`Cannot set and add/remove ${stringify(metadataClass)} at the same time!`);
            }
            setMetadata(props, override.set);
        }
        if (override.remove) {
            removeMetadata(props, override.remove, this._references);
        }
        if (override.add) {
            addMetadata(props, override.add);
        }
        return new metadataClass(/** @type {?} */ (props));
    }
}
if (false) {
    /** @type {?} */
    MetadataOverrider.prototype._references;
}
/**
 * @param {?} metadata
 * @param {?} remove
 * @param {?} references
 * @return {?}
 */
function removeMetadata(metadata, remove, references) {
    /** @type {?} */
    const removeObjects = new Set();
    for (const prop in remove) {
        /** @type {?} */
        const removeValue = remove[prop];
        if (removeValue instanceof Array) {
            removeValue.forEach((value) => { removeObjects.add(_propHashKey(prop, value, references)); });
        }
        else {
            removeObjects.add(_propHashKey(prop, removeValue, references));
        }
    }
    for (const prop in metadata) {
        /** @type {?} */
        const propValue = metadata[prop];
        if (propValue instanceof Array) {
            metadata[prop] = propValue.filter((value) => !removeObjects.has(_propHashKey(prop, value, references)));
        }
        else {
            if (removeObjects.has(_propHashKey(prop, propValue, references))) {
                metadata[prop] = undefined;
            }
        }
    }
}
/**
 * @param {?} metadata
 * @param {?} add
 * @return {?}
 */
function addMetadata(metadata, add) {
    for (const prop in add) {
        /** @type {?} */
        const addValue = add[prop];
        /** @type {?} */
        const propValue = metadata[prop];
        if (propValue != null && propValue instanceof Array) {
            metadata[prop] = propValue.concat(addValue);
        }
        else {
            metadata[prop] = addValue;
        }
    }
}
/**
 * @param {?} metadata
 * @param {?} set
 * @return {?}
 */
function setMetadata(metadata, set) {
    for (const prop in set) {
        metadata[prop] = set[prop];
    }
}
/**
 * @param {?} propName
 * @param {?} propValue
 * @param {?} references
 * @return {?}
 */
function _propHashKey(propName, propValue, references) {
    /** @type {?} */
    const replacer = (key, value) => {
        if (typeof value === 'function') {
            value = _serializeReference(value, references);
        }
        return value;
    };
    return `${propName}:${JSON.stringify(propValue, replacer)}`;
}
/**
 * @param {?} ref
 * @param {?} references
 * @return {?}
 */
function _serializeReference(ref, references) {
    /** @type {?} */
    let id = references.get(ref);
    if (!id) {
        id = `${stringify(ref)}${_nextReferenceId++}`;
        references.set(ref, id);
    }
    return id;
}
/**
 * @param {?} obj
 * @return {?}
 */
function _valueProps(obj) {
    /** @type {?} */
    const props = [];
    // regular public props
    Object.keys(obj).forEach((prop) => {
        if (!prop.startsWith('_')) {
            props.push(prop);
        }
    });
    /** @type {?} */
    let proto = obj;
    while (proto = Object.getPrototypeOf(proto)) {
        Object.keys(proto).forEach((protoProp) => {
            /** @type {?} */
            const desc = Object.getOwnPropertyDescriptor(proto, protoProp);
            if (!protoProp.startsWith('_') && desc && 'get' in desc) {
                props.push(protoProp);
            }
        });
    }
    return props;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGFfb3ZlcnJpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9tZXRhZGF0YV9vdmVycmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxJQUFJLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7OztBQU90RCxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztBQUV6QixNQUFNOzsyQkFDa0IsSUFBSSxHQUFHLEVBQWU7Ozs7Ozs7Ozs7O0lBSzVDLGdCQUFnQixDQUNaLGFBQXFDLEVBQUUsV0FBYyxFQUFFLFFBQTZCOztRQUN0RixNQUFNLEtBQUssR0FBYyxFQUFFLENBQUM7UUFDNUIsSUFBSSxXQUFXLEVBQUU7WUFDZixXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsbUJBQU0sV0FBVyxFQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNwRjtRQUVELElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNoQixJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsU0FBUyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2FBQzVGO1lBQ0QsV0FBVyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDbEM7UUFDRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUU7WUFDbkIsY0FBYyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUMxRDtRQUNELElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNoQixX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Z2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge8m1c3RyaW5naWZ5IGFzIHN0cmluZ2lmeX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuXG50eXBlIFN0cmluZ01hcCA9IHtcbiAgW2tleTogc3RyaW5nXTogYW55XG59O1xuXG5sZXQgX25leHRSZWZlcmVuY2VJZCA9IDA7XG5cbmV4cG9ydCBjbGFzcyBNZXRhZGF0YU92ZXJyaWRlciB7XG4gIHByaXZhdGUgX3JlZmVyZW5jZXMgPSBuZXcgTWFwPGFueSwgc3RyaW5nPigpO1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBmb3IgdGhlIGdpdmVuIG1ldGFkYXRhIGNsYXNzXG4gICAqIGJhc2VkIG9uIGFuIG9sZCBpbnN0YW5jZSBhbmQgb3ZlcnJpZGVzLlxuICAgKi9cbiAgb3ZlcnJpZGVNZXRhZGF0YTxDIGV4dGVuZHMgVCwgVD4oXG4gICAgICBtZXRhZGF0YUNsYXNzOiB7bmV3IChvcHRpb25zOiBUKTogQzt9LCBvbGRNZXRhZGF0YTogQywgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8VD4pOiBDIHtcbiAgICBjb25zdCBwcm9wczogU3RyaW5nTWFwID0ge307XG4gICAgaWYgKG9sZE1ldGFkYXRhKSB7XG4gICAgICBfdmFsdWVQcm9wcyhvbGRNZXRhZGF0YSkuZm9yRWFjaCgocHJvcCkgPT4gcHJvcHNbcHJvcF0gPSAoPGFueT5vbGRNZXRhZGF0YSlbcHJvcF0pO1xuICAgIH1cblxuICAgIGlmIChvdmVycmlkZS5zZXQpIHtcbiAgICAgIGlmIChvdmVycmlkZS5yZW1vdmUgfHwgb3ZlcnJpZGUuYWRkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHNldCBhbmQgYWRkL3JlbW92ZSAke3N0cmluZ2lmeShtZXRhZGF0YUNsYXNzKX0gYXQgdGhlIHNhbWUgdGltZSFgKTtcbiAgICAgIH1cbiAgICAgIHNldE1ldGFkYXRhKHByb3BzLCBvdmVycmlkZS5zZXQpO1xuICAgIH1cbiAgICBpZiAob3ZlcnJpZGUucmVtb3ZlKSB7XG4gICAgICByZW1vdmVNZXRhZGF0YShwcm9wcywgb3ZlcnJpZGUucmVtb3ZlLCB0aGlzLl9yZWZlcmVuY2VzKTtcbiAgICB9XG4gICAgaWYgKG92ZXJyaWRlLmFkZCkge1xuICAgICAgYWRkTWV0YWRhdGEocHJvcHMsIG92ZXJyaWRlLmFkZCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgbWV0YWRhdGFDbGFzcyg8YW55PnByb3BzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVNZXRhZGF0YShtZXRhZGF0YTogU3RyaW5nTWFwLCByZW1vdmU6IGFueSwgcmVmZXJlbmNlczogTWFwPGFueSwgc3RyaW5nPikge1xuICBjb25zdCByZW1vdmVPYmplY3RzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgcHJvcCBpbiByZW1vdmUpIHtcbiAgICBjb25zdCByZW1vdmVWYWx1ZSA9IHJlbW92ZVtwcm9wXTtcbiAgICBpZiAocmVtb3ZlVmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgcmVtb3ZlVmFsdWUuZm9yRWFjaChcbiAgICAgICAgICAodmFsdWU6IGFueSkgPT4geyByZW1vdmVPYmplY3RzLmFkZChfcHJvcEhhc2hLZXkocHJvcCwgdmFsdWUsIHJlZmVyZW5jZXMpKTsgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZU9iamVjdHMuYWRkKF9wcm9wSGFzaEtleShwcm9wLCByZW1vdmVWYWx1ZSwgcmVmZXJlbmNlcykpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgcHJvcCBpbiBtZXRhZGF0YSkge1xuICAgIGNvbnN0IHByb3BWYWx1ZSA9IG1ldGFkYXRhW3Byb3BdO1xuICAgIGlmIChwcm9wVmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgbWV0YWRhdGFbcHJvcF0gPSBwcm9wVmFsdWUuZmlsdGVyKFxuICAgICAgICAgICh2YWx1ZTogYW55KSA9PiAhcmVtb3ZlT2JqZWN0cy5oYXMoX3Byb3BIYXNoS2V5KHByb3AsIHZhbHVlLCByZWZlcmVuY2VzKSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocmVtb3ZlT2JqZWN0cy5oYXMoX3Byb3BIYXNoS2V5KHByb3AsIHByb3BWYWx1ZSwgcmVmZXJlbmNlcykpKSB7XG4gICAgICAgIG1ldGFkYXRhW3Byb3BdID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRNZXRhZGF0YShtZXRhZGF0YTogU3RyaW5nTWFwLCBhZGQ6IGFueSkge1xuICBmb3IgKGNvbnN0IHByb3AgaW4gYWRkKSB7XG4gICAgY29uc3QgYWRkVmFsdWUgPSBhZGRbcHJvcF07XG4gICAgY29uc3QgcHJvcFZhbHVlID0gbWV0YWRhdGFbcHJvcF07XG4gICAgaWYgKHByb3BWYWx1ZSAhPSBudWxsICYmIHByb3BWYWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBtZXRhZGF0YVtwcm9wXSA9IHByb3BWYWx1ZS5jb25jYXQoYWRkVmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtZXRhZGF0YVtwcm9wXSA9IGFkZFZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRNZXRhZGF0YShtZXRhZGF0YTogU3RyaW5nTWFwLCBzZXQ6IGFueSkge1xuICBmb3IgKGNvbnN0IHByb3AgaW4gc2V0KSB7XG4gICAgbWV0YWRhdGFbcHJvcF0gPSBzZXRbcHJvcF07XG4gIH1cbn1cblxuZnVuY3Rpb24gX3Byb3BIYXNoS2V5KHByb3BOYW1lOiBhbnksIHByb3BWYWx1ZTogYW55LCByZWZlcmVuY2VzOiBNYXA8YW55LCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgY29uc3QgcmVwbGFjZXIgPSAoa2V5OiBhbnksIHZhbHVlOiBhbnkpID0+IHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YWx1ZSA9IF9zZXJpYWxpemVSZWZlcmVuY2UodmFsdWUsIHJlZmVyZW5jZXMpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgcmV0dXJuIGAke3Byb3BOYW1lfToke0pTT04uc3RyaW5naWZ5KHByb3BWYWx1ZSwgcmVwbGFjZXIpfWA7XG59XG5cbmZ1bmN0aW9uIF9zZXJpYWxpemVSZWZlcmVuY2UocmVmOiBhbnksIHJlZmVyZW5jZXM6IE1hcDxhbnksIHN0cmluZz4pOiBzdHJpbmcge1xuICBsZXQgaWQgPSByZWZlcmVuY2VzLmdldChyZWYpO1xuICBpZiAoIWlkKSB7XG4gICAgaWQgPSBgJHtzdHJpbmdpZnkocmVmKX0ke19uZXh0UmVmZXJlbmNlSWQrK31gO1xuICAgIHJlZmVyZW5jZXMuc2V0KHJlZiwgaWQpO1xuICB9XG4gIHJldHVybiBpZDtcbn1cblxuXG5mdW5jdGlvbiBfdmFsdWVQcm9wcyhvYmo6IGFueSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgcHJvcHM6IHN0cmluZ1tdID0gW107XG4gIC8vIHJlZ3VsYXIgcHVibGljIHByb3BzXG4gIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgIGlmICghcHJvcC5zdGFydHNXaXRoKCdfJykpIHtcbiAgICAgIHByb3BzLnB1c2gocHJvcCk7XG4gICAgfVxuICB9KTtcblxuICAvLyBnZXR0ZXJzXG4gIGxldCBwcm90byA9IG9iajtcbiAgd2hpbGUgKHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvKSkge1xuICAgIE9iamVjdC5rZXlzKHByb3RvKS5mb3JFYWNoKChwcm90b1Byb3ApID0+IHtcbiAgICAgIGNvbnN0IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvLCBwcm90b1Byb3ApO1xuICAgICAgaWYgKCFwcm90b1Byb3Auc3RhcnRzV2l0aCgnXycpICYmIGRlc2MgJiYgJ2dldCcgaW4gZGVzYykge1xuICAgICAgICBwcm9wcy5wdXNoKHByb3RvUHJvcCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHByb3BzO1xufVxuIl19