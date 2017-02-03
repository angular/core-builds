/**
 * Provides read-only access to reflection data about symbols. Used internally by Angular
 * to power dependency injection and compilation.
 * @abstract
 */
export class ReflectorReader {
    /**
     * @abstract
     * @param {?} typeOrFunc
     * @return {?}
     */
    parameters(typeOrFunc) { }
    /**
     * @abstract
     * @param {?} typeOrFunc
     * @return {?}
     */
    annotations(typeOrFunc) { }
    /**
     * @abstract
     * @param {?} typeOrFunc
     * @return {?}
     */
    propMetadata(typeOrFunc) { }
    /**
     * @abstract
     * @param {?} typeOrFunc
     * @return {?}
     */
    importUri(typeOrFunc) { }
    /**
     * @abstract
     * @param {?} name
     * @param {?} moduleUrl
     * @param {?} runtime
     * @return {?}
     */
    resolveIdentifier(name, moduleUrl, runtime) { }
    /**
     * @abstract
     * @param {?} identifier
     * @param {?} name
     * @return {?}
     */
    resolveEnum(identifier, name) { }
}
//# sourceMappingURL=reflector_reader.js.map