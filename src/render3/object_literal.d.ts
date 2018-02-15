/**
 * If the object or array has changed, returns a copy with the updated expression.
 * Or if the expression hasn't changed, returns NO_CHANGE.
 *
 * @param factoryFn Function that returns an updated instance of the object/array
 * @param exp Updated expression value
 * @returns A copy of the object/array or NO_CHANGE
 */
export declare function objectLiteral1(factoryFn: (v: any) => any, exp: any): any;
/**
 * If the object or array has changed, returns a copy with all updated expressions.
 * Or if no expressions have changed, returns NO_CHANGE.
 *
 * @param factoryFn
 * @param exp1
 * @param exp2
 * @returns A copy of the object/array or NO_CHANGE
 */
export declare function objectLiteral2(factoryFn: (v1: any, v2: any) => any, exp1: any, exp2: any): any;
/**
 * If the object or array has changed, returns a copy with all updated expressions.
 * Or if no expressions have changed, returns NO_CHANGE.
 *
 * @param factoryFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @returns A copy of the object/array or NO_CHANGE
 */
export declare function objectLiteral3(factoryFn: (v1: any, v2: any, v3: any) => any, exp1: any, exp2: any, exp3: any): any;
/**
 * If the object or array has changed, returns a copy with all updated expressions.
 * Or if no expressions have changed, returns NO_CHANGE.
 *
 * @param factoryFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @returns A copy of the object/array or NO_CHANGE
 */
export declare function objectLiteral4(factoryFn: (v1: any, v2: any, v3: any, v4: any) => any, exp1: any, exp2: any, exp3: any, exp4: any): any;
/**
 * If the object or array has changed, returns a copy with all updated expressions.
 * Or if no expressions have changed, returns NO_CHANGE.
 *
 * @param factoryFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param exp5
 * @returns A copy of the object/array or NO_CHANGE
 */
export declare function objectLiteral5(factoryFn: (v1: any, v2: any, v3: any, v4: any, v5: any) => any, exp1: any, exp2: any, exp3: any, exp4: any, exp5: any): any;
/**
 * If the object or array has changed, returns a copy with all updated expressions.
 * Or if no expressions have changed, returns NO_CHANGE.
 *
 * @param factoryFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param exp5
 * @param exp6
 * @returns A copy of the object/array or NO_CHANGE
 */
export declare function objectLiteral6(factoryFn: (v1: any, v2: any, v3: any, v4: any, v5: any, v6: any) => any, exp1: any, exp2: any, exp3: any, exp4: any, exp5: any, exp6: any): any;
/**
 * If the object or array has changed, returns a copy with all updated expressions.
 * Or if no expressions have changed, returns NO_CHANGE.
 *
 * @param factoryFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param exp5
 * @param exp6
 * @param exp7
 * @returns A copy of the object/array or NO_CHANGE
 */
export declare function objectLiteral7(factoryFn: (v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any) => any, exp1: any, exp2: any, exp3: any, exp4: any, exp5: any, exp6: any, exp7: any): any;
/**
 * If the object or array has changed, returns a copy with all updated expressions.
 * Or if no expressions have changed, returns NO_CHANGE.
 *
 * @param factoryFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param exp5
 * @param exp6
 * @param exp7
 * @param exp8
 * @returns A copy of the object/array or NO_CHANGE
 */
export declare function objectLiteral8(factoryFn: (v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any) => any, exp1: any, exp2: any, exp3: any, exp4: any, exp5: any, exp6: any, exp7: any, exp8: any): any;
/**
 * objectLiteral instruction that can support any number of bindings.
 *
 * If the object or array has changed, returns a copy with all updated expressions.
 * Or if no expressions have changed, returns NO_CHANGE.
 *
 * @param factoryFn A factory function that takes binding values and builds an object or array
 * containing those values.
 * @param exp An array of binding values
 * @returns A copy of the object/array or NO_CHANGE
 */
export declare function objectLiteralV(factoryFn: (v: any[]) => any, exps: any[]): any;
