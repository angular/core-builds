import { NgModule, NgModuleDef } from '../../metadata/ng_module';
import { Type } from '../../type';
import { ComponentDef } from '../interfaces/definition';
export declare function compileNgModule(type: Type<any>, ngModule: NgModule): void;
export declare function patchComponentWithScope<C, M>(component: Type<C> & {
    ngComponentDef: ComponentDef<C>;
}, module: Type<M> & {
    ngModuleDef: NgModuleDef<M>;
}): void;
