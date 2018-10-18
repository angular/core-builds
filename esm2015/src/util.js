/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const __window = typeof window !== 'undefined' && window;
const __self = typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope && self;
const __global = typeof global !== 'undefined' && global;
// Check __global first, because in Node tests both __global and __window may be defined and _global
// should be __global in that case.
const _global = __global || __window || __self;
const promise = Promise.resolve(0);
/**
 * Attention: whenever providing a new value, be sure to add an
 * entry into the corresponding `....externs.js` file,
 * so that closure won't use that global for its purposes.
 */
export { _global as global };
let _symbolIterator = null;
export function getSymbolIterator() {
    if (!_symbolIterator) {
        const Symbol = _global['Symbol'];
        if (Symbol && Symbol.iterator) {
            _symbolIterator = Symbol.iterator;
        }
        else {
            // es6-shim specific logic
            const keys = Object.getOwnPropertyNames(Map.prototype);
            for (let i = 0; i < keys.length; ++i) {
                const key = keys[i];
                if (key !== 'entries' && key !== 'size' &&
                    Map.prototype[key] === Map.prototype['entries']) {
                    _symbolIterator = key;
                }
            }
        }
    }
    return _symbolIterator;
}
export function scheduleMicroTask(fn) {
    if (typeof Zone === 'undefined') {
        // use promise to schedule microTask instead of use Zone
        promise.then(() => { fn && fn.apply(null, null); });
    }
    else {
        Zone.current.scheduleMicroTask('scheduleMicrotask', fn);
    }
}
// JS has NaN !== NaN
export function looseIdentical(a, b) {
    return a === b || typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b);
}
export function stringify(token) {
    if (typeof token === 'string') {
        return token;
    }
    if (token instanceof Array) {
        return '[' + token.map(stringify).join(', ') + ']';
    }
    if (token == null) {
        return '' + token;
    }
    if (token.overriddenName) {
        return `${token.overriddenName}`;
    }
    if (token.name) {
        return `${token.name}`;
    }
    const res = token.toString();
    if (res == null) {
        return '' + res;
    }
    const newLineIndex = res.indexOf('\n');
    return newLineIndex === -1 ? res : res.substring(0, newLineIndex);
}
/**
 * Convince closure compiler that the wrapped function has no side-effects.
 *
 * Closure compiler always assumes that `toString` has no side-effects. We use this quirk to
 * allow us to execute a function but have closure compiler mark the call as no-side-effects.
 * It is important that the return value for the `noSideEffects` function be assigned
 * to something which is retained otherwise the call to `noSideEffects` will be removed by closure
 * compiler.
 */
export function noSideEffects(fn) {
    return '' + { toString: fn };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBUUgsTUFBTSxRQUFRLEdBQUcsT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQztBQUN6RCxNQUFNLE1BQU0sR0FBRyxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksT0FBTyxpQkFBaUIsS0FBSyxXQUFXO0lBQ2xGLElBQUksWUFBWSxpQkFBaUIsSUFBSSxJQUFJLENBQUM7QUFDOUMsTUFBTSxRQUFRLEdBQUcsT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQztBQUV6RCxvR0FBb0c7QUFDcEcsbUNBQW1DO0FBQ25DLE1BQU0sT0FBTyxHQUEwQixRQUFRLElBQUksUUFBUSxJQUFJLE1BQU0sQ0FBQztBQUV0RSxNQUFNLE9BQU8sR0FBaUIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRDs7OztHQUlHO0FBQ0gsT0FBTyxFQUFDLE9BQU8sSUFBSSxNQUFNLEVBQUMsQ0FBQztBQUkzQixJQUFJLGVBQWUsR0FBUSxJQUFJLENBQUM7QUFDaEMsTUFBTSxVQUFVLGlCQUFpQjtJQUMvQixJQUFJLENBQUMsZUFBZSxFQUFFO1FBQ3BCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqQyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzdCLGVBQWUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQ25DO2FBQU07WUFDTCwwQkFBMEI7WUFDMUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDcEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixJQUFJLEdBQUcsS0FBSyxTQUFTLElBQUksR0FBRyxLQUFLLE1BQU07b0JBQ2xDLEdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDNUQsZUFBZSxHQUFHLEdBQUcsQ0FBQztpQkFDdkI7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLGVBQWUsQ0FBQztBQUN6QixDQUFDO0FBRUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEVBQVk7SUFDNUMsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLEVBQUU7UUFDL0Isd0RBQXdEO1FBQ3hELE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDckQ7U0FBTTtRQUNMLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDekQ7QUFDSCxDQUFDO0FBRUQscUJBQXFCO0FBQ3JCLE1BQU0sVUFBVSxjQUFjLENBQUMsQ0FBTSxFQUFFLENBQU07SUFDM0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRixDQUFDO0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFVO0lBQ2xDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzdCLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxJQUFJLEtBQUssWUFBWSxLQUFLLEVBQUU7UUFDMUIsT0FBTyxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0tBQ3BEO0lBRUQsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO1FBQ2pCLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQztLQUNuQjtJQUVELElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRTtRQUN4QixPQUFPLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO0tBQ2xDO0lBRUQsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFO1FBQ2QsT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUN4QjtJQUVELE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUU3QixJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUU7UUFDZixPQUFPLEVBQUUsR0FBRyxHQUFHLENBQUM7S0FDakI7SUFFRCxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQUMsRUFBYztJQUMxQyxPQUFPLEVBQUUsR0FBRyxFQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUMsQ0FBQztBQUM3QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBUT0RPKGp0ZXBsaXR6NjAyKTogTG9hZCBXb3JrZXJHbG9iYWxTY29wZSBmcm9tIGxpYi53ZWJ3b3JrZXIuZC50cyBmaWxlICMzNDkyXG5kZWNsYXJlIHZhciBXb3JrZXJHbG9iYWxTY29wZTogYW55IC8qKiBUT0RPICM5MTAwICovO1xuLy8gQ29tbW9uSlMgLyBOb2RlIGhhdmUgZ2xvYmFsIGNvbnRleHQgZXhwb3NlZCBhcyBcImdsb2JhbFwiIHZhcmlhYmxlLlxuLy8gV2UgZG9uJ3Qgd2FudCB0byBpbmNsdWRlIHRoZSB3aG9sZSBub2RlLmQudHMgdGhpcyB0aGlzIGNvbXBpbGF0aW9uIHVuaXQgc28gd2UnbGwganVzdCBmYWtlXG4vLyB0aGUgZ2xvYmFsIFwiZ2xvYmFsXCIgdmFyIGZvciBub3cuXG5kZWNsYXJlIHZhciBnbG9iYWw6IGFueSAvKiogVE9ETyAjOTEwMCAqLztcbmNvbnN0IF9fd2luZG93ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93O1xuY29uc3QgX19zZWxmID0gdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBXb3JrZXJHbG9iYWxTY29wZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICBzZWxmIGluc3RhbmNlb2YgV29ya2VyR2xvYmFsU2NvcGUgJiYgc2VsZjtcbmNvbnN0IF9fZ2xvYmFsID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsO1xuXG4vLyBDaGVjayBfX2dsb2JhbCBmaXJzdCwgYmVjYXVzZSBpbiBOb2RlIHRlc3RzIGJvdGggX19nbG9iYWwgYW5kIF9fd2luZG93IG1heSBiZSBkZWZpbmVkIGFuZCBfZ2xvYmFsXG4vLyBzaG91bGQgYmUgX19nbG9iYWwgaW4gdGhhdCBjYXNlLlxuY29uc3QgX2dsb2JhbDoge1tuYW1lOiBzdHJpbmddOiBhbnl9ID0gX19nbG9iYWwgfHwgX193aW5kb3cgfHwgX19zZWxmO1xuXG5jb25zdCBwcm9taXNlOiBQcm9taXNlPGFueT4gPSBQcm9taXNlLnJlc29sdmUoMCk7XG4vKipcbiAqIEF0dGVudGlvbjogd2hlbmV2ZXIgcHJvdmlkaW5nIGEgbmV3IHZhbHVlLCBiZSBzdXJlIHRvIGFkZCBhblxuICogZW50cnkgaW50byB0aGUgY29ycmVzcG9uZGluZyBgLi4uLmV4dGVybnMuanNgIGZpbGUsXG4gKiBzbyB0aGF0IGNsb3N1cmUgd29uJ3QgdXNlIHRoYXQgZ2xvYmFsIGZvciBpdHMgcHVycG9zZXMuXG4gKi9cbmV4cG9ydCB7X2dsb2JhbCBhcyBnbG9iYWx9O1xuXG4vLyBXaGVuIFN5bWJvbC5pdGVyYXRvciBkb2Vzbid0IGV4aXN0LCByZXRyaWV2ZXMgdGhlIGtleSB1c2VkIGluIGVzNi1zaGltXG5kZWNsYXJlIGNvbnN0IFN5bWJvbDogYW55O1xubGV0IF9zeW1ib2xJdGVyYXRvcjogYW55ID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRTeW1ib2xJdGVyYXRvcigpOiBzdHJpbmd8c3ltYm9sIHtcbiAgaWYgKCFfc3ltYm9sSXRlcmF0b3IpIHtcbiAgICBjb25zdCBTeW1ib2wgPSBfZ2xvYmFsWydTeW1ib2wnXTtcbiAgICBpZiAoU3ltYm9sICYmIFN5bWJvbC5pdGVyYXRvcikge1xuICAgICAgX3N5bWJvbEl0ZXJhdG9yID0gU3ltYm9sLml0ZXJhdG9yO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBlczYtc2hpbSBzcGVjaWZpYyBsb2dpY1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKE1hcC5wcm90b3R5cGUpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG4gICAgICAgIGlmIChrZXkgIT09ICdlbnRyaWVzJyAmJiBrZXkgIT09ICdzaXplJyAmJlxuICAgICAgICAgICAgKE1hcCBhcyBhbnkpLnByb3RvdHlwZVtrZXldID09PSBNYXAucHJvdG90eXBlWydlbnRyaWVzJ10pIHtcbiAgICAgICAgICBfc3ltYm9sSXRlcmF0b3IgPSBrZXk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIF9zeW1ib2xJdGVyYXRvcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlTWljcm9UYXNrKGZuOiBGdW5jdGlvbikge1xuICBpZiAodHlwZW9mIFpvbmUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgLy8gdXNlIHByb21pc2UgdG8gc2NoZWR1bGUgbWljcm9UYXNrIGluc3RlYWQgb2YgdXNlIFpvbmVcbiAgICBwcm9taXNlLnRoZW4oKCkgPT4geyBmbiAmJiBmbi5hcHBseShudWxsLCBudWxsKTsgfSk7XG4gIH0gZWxzZSB7XG4gICAgWm9uZS5jdXJyZW50LnNjaGVkdWxlTWljcm9UYXNrKCdzY2hlZHVsZU1pY3JvdGFzaycsIGZuKTtcbiAgfVxufVxuXG4vLyBKUyBoYXMgTmFOICE9PSBOYU5cbmV4cG9ydCBmdW5jdGlvbiBsb29zZUlkZW50aWNhbChhOiBhbnksIGI6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gYSA9PT0gYiB8fCB0eXBlb2YgYSA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGIgPT09ICdudW1iZXInICYmIGlzTmFOKGEpICYmIGlzTmFOKGIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5KHRva2VuOiBhbnkpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIGlmICh0b2tlbiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgcmV0dXJuICdbJyArIHRva2VuLm1hcChzdHJpbmdpZnkpLmpvaW4oJywgJykgKyAnXSc7XG4gIH1cblxuICBpZiAodG9rZW4gPT0gbnVsbCkge1xuICAgIHJldHVybiAnJyArIHRva2VuO1xuICB9XG5cbiAgaWYgKHRva2VuLm92ZXJyaWRkZW5OYW1lKSB7XG4gICAgcmV0dXJuIGAke3Rva2VuLm92ZXJyaWRkZW5OYW1lfWA7XG4gIH1cblxuICBpZiAodG9rZW4ubmFtZSkge1xuICAgIHJldHVybiBgJHt0b2tlbi5uYW1lfWA7XG4gIH1cblxuICBjb25zdCByZXMgPSB0b2tlbi50b1N0cmluZygpO1xuXG4gIGlmIChyZXMgPT0gbnVsbCkge1xuICAgIHJldHVybiAnJyArIHJlcztcbiAgfVxuXG4gIGNvbnN0IG5ld0xpbmVJbmRleCA9IHJlcy5pbmRleE9mKCdcXG4nKTtcbiAgcmV0dXJuIG5ld0xpbmVJbmRleCA9PT0gLTEgPyByZXMgOiByZXMuc3Vic3RyaW5nKDAsIG5ld0xpbmVJbmRleCk7XG59XG5cbi8qKlxuICogQ29udmluY2UgY2xvc3VyZSBjb21waWxlciB0aGF0IHRoZSB3cmFwcGVkIGZ1bmN0aW9uIGhhcyBubyBzaWRlLWVmZmVjdHMuXG4gKlxuICogQ2xvc3VyZSBjb21waWxlciBhbHdheXMgYXNzdW1lcyB0aGF0IGB0b1N0cmluZ2AgaGFzIG5vIHNpZGUtZWZmZWN0cy4gV2UgdXNlIHRoaXMgcXVpcmsgdG9cbiAqIGFsbG93IHVzIHRvIGV4ZWN1dGUgYSBmdW5jdGlvbiBidXQgaGF2ZSBjbG9zdXJlIGNvbXBpbGVyIG1hcmsgdGhlIGNhbGwgYXMgbm8tc2lkZS1lZmZlY3RzLlxuICogSXQgaXMgaW1wb3J0YW50IHRoYXQgdGhlIHJldHVybiB2YWx1ZSBmb3IgdGhlIGBub1NpZGVFZmZlY3RzYCBmdW5jdGlvbiBiZSBhc3NpZ25lZFxuICogdG8gc29tZXRoaW5nIHdoaWNoIGlzIHJldGFpbmVkIG90aGVyd2lzZSB0aGUgY2FsbCB0byBgbm9TaWRlRWZmZWN0c2Agd2lsbCBiZSByZW1vdmVkIGJ5IGNsb3N1cmVcbiAqIGNvbXBpbGVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9TaWRlRWZmZWN0cyhmbjogKCkgPT4gdm9pZCk6IHN0cmluZyB7XG4gIHJldHVybiAnJyArIHt0b1N0cmluZzogZm59O1xufSJdfQ==