/**
 * @license Angular v21.0.0-next.5+sha-c3a949a
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

/**
 * Current injector value used by `inject`.
 * - `undefined`: it is an error to call `inject`
 * - `null`: `inject` can be called but there is no injector (limp-mode).
 * - Injector instance: Use the injector for resolution.
 */
let _currentInjector = undefined;
function getCurrentInjector() {
    return _currentInjector;
}
function setCurrentInjector(injector) {
    const former = _currentInjector;
    _currentInjector = injector;
    return former;
}
function inject(token, options) {
    const currentInjector = getCurrentInjector();
    if (!currentInjector) {
        throw new Error('Current injector is not set.');
    }
    if (!token.ɵprov) {
        throw new Error('Token is not an injectable');
    }
    return currentInjector.retrieve(token, options);
}

/**
 * Value returned if the key-value pair couldn't be found in the context
 * hierarchy.
 */
const NOT_FOUND = Symbol('NotFound');
/**
 * Error thrown when the key-value pair couldn't be found in the context
 * hierarchy. Context can be attached below.
 */
class NotFoundError extends Error {
    name = 'ɵNotFound';
    constructor(message) {
        super(message);
    }
}
/**
 * Type guard for checking if an unknown value is a NotFound.
 */
function isNotFound(e) {
    return e === NOT_FOUND || e?.name === 'ɵNotFound';
}

export { NOT_FOUND, NotFoundError, getCurrentInjector, inject, isNotFound, setCurrentInjector };
//# sourceMappingURL=not_found-a-Oi0ovH.mjs.map
