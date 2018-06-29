import { ComponentDefInternal, DirectiveDefInternal } from '../interfaces/definition';
/**
 * Merges the definition from a super class to a sub class.
 * @param definition The definition that is a SubClass of another directive of component
 */
export declare function InheritDefinitionFeature(definition: DirectiveDefInternal<any> | ComponentDefInternal<any>): void;
