import { InjectMetadata, OptionalMetadata, InjectableMetadata, SelfMetadata, HostMetadata, SkipSelfMetadata } from './metadata';
import { makeDecorator, makeParamDecorator } from '../util/decorators';
/**
 * Factory for creating {@link InjectMetadata}.
 * @stable
 */
export var Inject = makeParamDecorator(InjectMetadata);
/**
 * Factory for creating {@link OptionalMetadata}.
 * @stable
 */
export var Optional = makeParamDecorator(OptionalMetadata);
/**
 * Factory for creating {@link InjectableMetadata}.
 * @stable
 */
export var Injectable = makeDecorator(InjectableMetadata);
/**
 * Factory for creating {@link SelfMetadata}.
 * @stable
 */
export var Self = makeParamDecorator(SelfMetadata);
/**
 * Factory for creating {@link HostMetadata}.
 * @stable
 */
export var Host = makeParamDecorator(HostMetadata);
/**
 * Factory for creating {@link SkipSelfMetadata}.
 * @stable
 */
export var SkipSelf = makeParamDecorator(SkipSelfMetadata);
//# sourceMappingURL=decorators.js.map