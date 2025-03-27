/**
 * @license Angular v20.0.0-next.4+sha-f7385b4
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

export { g as getCurrentInjector, s as setCurrentInjector } from '../injector-BlLwZ2sr.mjs';

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
    return e === NOT_FOUND || e.name === 'ɵNotFound';
}

export { NOT_FOUND, NotFoundError, isNotFound };
//# sourceMappingURL=di.mjs.map
