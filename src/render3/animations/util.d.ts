/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Timing } from './interfaces';
export declare function computeStyle(element: HTMLElement, prop: string): string;
/**
 *
 * @param element
 * @param cb
 */
export declare function applyReflow(element: HTMLElement, cb?: ((reflow: number) => any) | null): void;
export declare function now(): number;
export declare function parseTimingExp(exp: string | number | Timing): Timing;
export declare function applyTransition(element: HTMLElement, value: string | null): void;
export declare function readStyle(element: HTMLElement | CSSStyleDeclaration, prop: string): any;
export declare function hyphenateProp(prop: string): string;
export declare function applyClassChanges(element: HTMLElement, classes: {
    [key: string]: boolean;
}, revert?: boolean, store?: {
    [key: string]: any;
} | null): void;
export declare function applyStyleChanges(element: HTMLElement, styles: {
    [key: string]: any;
}, backupStyles?: {
    [key: string]: any;
} | null, revert?: boolean, preComputedStyles?: {
    [key: string]: any;
} | null, store?: {
    [key: string]: any;
} | null): void;
export declare function applyStyle(element: HTMLElement, prop: string, value: string | null): void;
