import { Injectable } from '../../di/injectable';
import { Type } from '../../type';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 */
export declare function compileInjectable(type: Type<any>, meta?: Injectable): void;
