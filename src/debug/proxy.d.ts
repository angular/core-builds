/**
 * Creates an instance of a `Proxy` and creates with an empty target object and binds it to the
 * provided handler.
 *
 * The reason why this function exists is because IE doesn't support
 * the `Proxy` class. For this reason an error must be thrown.
 */
export declare function createProxy(handler: ProxyHandler<any>): {};
