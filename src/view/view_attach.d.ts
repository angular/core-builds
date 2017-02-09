import { ElementData, ViewData } from './types';
export declare function attachEmbeddedView(elementData: ElementData, viewIndex: number, view: ViewData): void;
export declare function detachEmbeddedView(elementData: ElementData, viewIndex: number): ViewData;
export declare function moveEmbeddedView(elementData: ElementData, oldViewIndex: number, newViewIndex: number): ViewData;
