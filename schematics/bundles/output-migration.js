'use strict';
/**
 * @license Angular v19.0.0-next.10+sha-65de20c
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var project_tsconfig_paths = require('./project_tsconfig_paths-e9ccccbf.js');
var index = require('./index-f7b283e6.js');
require('os');
var ts = require('typescript');
var checker = require('./checker-51c08a1b.js');
var assert = require('assert');
var program = require('./program-6e6520d8.js');
require('path');
require('fs');
require('module');
var url = require('url');
require('@angular-devkit/core');
require('node:path/posix');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);
var assert__default = /*#__PURE__*/_interopDefaultLegacy(assert);

/**
 * Disambiguates different kinds of compiler metadata objects.
 */
var MetaKind;
(function (MetaKind) {
    MetaKind[MetaKind["Directive"] = 0] = "Directive";
    MetaKind[MetaKind["Pipe"] = 1] = "Pipe";
    MetaKind[MetaKind["NgModule"] = 2] = "NgModule";
})(MetaKind || (MetaKind = {}));
/**
 * Possible ways that a directive can be matched.
 */
var MatchSource;
(function (MatchSource) {
    /** The directive was matched by its selector. */
    MatchSource[MatchSource["Selector"] = 0] = "Selector";
    /** The directive was applied as a host directive. */
    MatchSource[MatchSource["HostDirective"] = 1] = "HostDirective";
})(MatchSource || (MatchSource = {}));

/**
 * @publicApi
 */
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["DECORATOR_ARG_NOT_LITERAL"] = 1001] = "DECORATOR_ARG_NOT_LITERAL";
    ErrorCode[ErrorCode["DECORATOR_ARITY_WRONG"] = 1002] = "DECORATOR_ARITY_WRONG";
    ErrorCode[ErrorCode["DECORATOR_NOT_CALLED"] = 1003] = "DECORATOR_NOT_CALLED";
    ErrorCode[ErrorCode["DECORATOR_UNEXPECTED"] = 1005] = "DECORATOR_UNEXPECTED";
    /**
     * This error code indicates that there are incompatible decorators on a type or a class field.
     */
    ErrorCode[ErrorCode["DECORATOR_COLLISION"] = 1006] = "DECORATOR_COLLISION";
    ErrorCode[ErrorCode["VALUE_HAS_WRONG_TYPE"] = 1010] = "VALUE_HAS_WRONG_TYPE";
    ErrorCode[ErrorCode["VALUE_NOT_LITERAL"] = 1011] = "VALUE_NOT_LITERAL";
    /**
     * Raised when an initializer API is annotated with an unexpected decorator.
     *
     * e.g. `@Input` is also applied on the class member using `input`.
     */
    ErrorCode[ErrorCode["INITIALIZER_API_WITH_DISALLOWED_DECORATOR"] = 1050] = "INITIALIZER_API_WITH_DISALLOWED_DECORATOR";
    /**
     * Raised when an initializer API feature (like signal inputs) are also
     * declared in the class decorator metadata.
     *
     * e.g. a signal input is also declared in the `@Directive` `inputs` array.
     */
    ErrorCode[ErrorCode["INITIALIZER_API_DECORATOR_METADATA_COLLISION"] = 1051] = "INITIALIZER_API_DECORATOR_METADATA_COLLISION";
    /**
     * Raised whenever an initializer API does not support the `.required`
     * function, but is still detected unexpectedly.
     */
    ErrorCode[ErrorCode["INITIALIZER_API_NO_REQUIRED_FUNCTION"] = 1052] = "INITIALIZER_API_NO_REQUIRED_FUNCTION";
    /**
     * Raised whenever an initializer API is used on a class member
     * and the given access modifiers (e.g. `private`) are not allowed.
     */
    ErrorCode[ErrorCode["INITIALIZER_API_DISALLOWED_MEMBER_VISIBILITY"] = 1053] = "INITIALIZER_API_DISALLOWED_MEMBER_VISIBILITY";
    /**
     * An Angular feature, like inputs, outputs or queries is incorrectly
     * declared on a static member.
     */
    ErrorCode[ErrorCode["INCORRECTLY_DECLARED_ON_STATIC_MEMBER"] = 1100] = "INCORRECTLY_DECLARED_ON_STATIC_MEMBER";
    ErrorCode[ErrorCode["COMPONENT_MISSING_TEMPLATE"] = 2001] = "COMPONENT_MISSING_TEMPLATE";
    ErrorCode[ErrorCode["PIPE_MISSING_NAME"] = 2002] = "PIPE_MISSING_NAME";
    ErrorCode[ErrorCode["PARAM_MISSING_TOKEN"] = 2003] = "PARAM_MISSING_TOKEN";
    ErrorCode[ErrorCode["DIRECTIVE_MISSING_SELECTOR"] = 2004] = "DIRECTIVE_MISSING_SELECTOR";
    /** Raised when an undecorated class is passed in as a provider to a module or a directive. */
    ErrorCode[ErrorCode["UNDECORATED_PROVIDER"] = 2005] = "UNDECORATED_PROVIDER";
    /**
     * Raised when a Directive inherits its constructor from a base class without an Angular
     * decorator.
     */
    ErrorCode[ErrorCode["DIRECTIVE_INHERITS_UNDECORATED_CTOR"] = 2006] = "DIRECTIVE_INHERITS_UNDECORATED_CTOR";
    /**
     * Raised when an undecorated class that is using Angular features
     * has been discovered.
     */
    ErrorCode[ErrorCode["UNDECORATED_CLASS_USING_ANGULAR_FEATURES"] = 2007] = "UNDECORATED_CLASS_USING_ANGULAR_FEATURES";
    /**
     * Raised when an component cannot resolve an external resource, such as a template or a style
     * sheet.
     */
    ErrorCode[ErrorCode["COMPONENT_RESOURCE_NOT_FOUND"] = 2008] = "COMPONENT_RESOURCE_NOT_FOUND";
    /**
     * Raised when a component uses `ShadowDom` view encapsulation, but its selector
     * does not match the shadow DOM tag name requirements.
     */
    ErrorCode[ErrorCode["COMPONENT_INVALID_SHADOW_DOM_SELECTOR"] = 2009] = "COMPONENT_INVALID_SHADOW_DOM_SELECTOR";
    /**
     * Raised when a component has `imports` but is not marked as `standalone: true`.
     */
    ErrorCode[ErrorCode["COMPONENT_NOT_STANDALONE"] = 2010] = "COMPONENT_NOT_STANDALONE";
    /**
     * Raised when a type in the `imports` of a component is a directive or pipe, but is not
     * standalone.
     */
    ErrorCode[ErrorCode["COMPONENT_IMPORT_NOT_STANDALONE"] = 2011] = "COMPONENT_IMPORT_NOT_STANDALONE";
    /**
     * Raised when a type in the `imports` of a component is not a directive, pipe, or NgModule.
     */
    ErrorCode[ErrorCode["COMPONENT_UNKNOWN_IMPORT"] = 2012] = "COMPONENT_UNKNOWN_IMPORT";
    /**
     * Raised when the compiler wasn't able to resolve the metadata of a host directive.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_INVALID"] = 2013] = "HOST_DIRECTIVE_INVALID";
    /**
     * Raised when a host directive isn't standalone.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_NOT_STANDALONE"] = 2014] = "HOST_DIRECTIVE_NOT_STANDALONE";
    /**
     * Raised when a host directive is a component.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_COMPONENT"] = 2015] = "HOST_DIRECTIVE_COMPONENT";
    /**
     * Raised when a type with Angular decorator inherits its constructor from a base class
     * which has a constructor that is incompatible with Angular DI.
     */
    ErrorCode[ErrorCode["INJECTABLE_INHERITS_INVALID_CONSTRUCTOR"] = 2016] = "INJECTABLE_INHERITS_INVALID_CONSTRUCTOR";
    /** Raised when a host tries to alias a host directive binding that does not exist. */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_UNDEFINED_BINDING"] = 2017] = "HOST_DIRECTIVE_UNDEFINED_BINDING";
    /**
     * Raised when a host tries to alias a host directive
     * binding to a pre-existing binding's public name.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_CONFLICTING_ALIAS"] = 2018] = "HOST_DIRECTIVE_CONFLICTING_ALIAS";
    /**
     * Raised when a host directive definition doesn't expose a
     * required binding from the host directive.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_MISSING_REQUIRED_BINDING"] = 2019] = "HOST_DIRECTIVE_MISSING_REQUIRED_BINDING";
    /**
     * Raised when a component specifies both a `transform` function on an input
     * and has a corresponding `ngAcceptInputType_` member for the same input.
     */
    ErrorCode[ErrorCode["CONFLICTING_INPUT_TRANSFORM"] = 2020] = "CONFLICTING_INPUT_TRANSFORM";
    /** Raised when a component has both `styleUrls` and `styleUrl`. */
    ErrorCode[ErrorCode["COMPONENT_INVALID_STYLE_URLS"] = 2021] = "COMPONENT_INVALID_STYLE_URLS";
    /**
     * Raised when a type in the `deferredImports` of a component is not a component, directive or
     * pipe.
     */
    ErrorCode[ErrorCode["COMPONENT_UNKNOWN_DEFERRED_IMPORT"] = 2022] = "COMPONENT_UNKNOWN_DEFERRED_IMPORT";
    /**
     * Raised when a `standalone: false` component is declared but `strictStandalone` is set.
     */
    ErrorCode[ErrorCode["NON_STANDALONE_NOT_ALLOWED"] = 2023] = "NON_STANDALONE_NOT_ALLOWED";
    ErrorCode[ErrorCode["SYMBOL_NOT_EXPORTED"] = 3001] = "SYMBOL_NOT_EXPORTED";
    /**
     * Raised when a relationship between directives and/or pipes would cause a cyclic import to be
     * created that cannot be handled, such as in partial compilation mode.
     */
    ErrorCode[ErrorCode["IMPORT_CYCLE_DETECTED"] = 3003] = "IMPORT_CYCLE_DETECTED";
    /**
     * Raised when the compiler is unable to generate an import statement for a reference.
     */
    ErrorCode[ErrorCode["IMPORT_GENERATION_FAILURE"] = 3004] = "IMPORT_GENERATION_FAILURE";
    ErrorCode[ErrorCode["CONFIG_FLAT_MODULE_NO_INDEX"] = 4001] = "CONFIG_FLAT_MODULE_NO_INDEX";
    ErrorCode[ErrorCode["CONFIG_STRICT_TEMPLATES_IMPLIES_FULL_TEMPLATE_TYPECHECK"] = 4002] = "CONFIG_STRICT_TEMPLATES_IMPLIES_FULL_TEMPLATE_TYPECHECK";
    ErrorCode[ErrorCode["CONFIG_EXTENDED_DIAGNOSTICS_IMPLIES_STRICT_TEMPLATES"] = 4003] = "CONFIG_EXTENDED_DIAGNOSTICS_IMPLIES_STRICT_TEMPLATES";
    ErrorCode[ErrorCode["CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CATEGORY_LABEL"] = 4004] = "CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CATEGORY_LABEL";
    ErrorCode[ErrorCode["CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CHECK"] = 4005] = "CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CHECK";
    /**
     * Raised when a host expression has a parse error, such as a host listener or host binding
     * expression containing a pipe.
     */
    ErrorCode[ErrorCode["HOST_BINDING_PARSE_ERROR"] = 5001] = "HOST_BINDING_PARSE_ERROR";
    /**
     * Raised when the compiler cannot parse a component's template.
     */
    ErrorCode[ErrorCode["TEMPLATE_PARSE_ERROR"] = 5002] = "TEMPLATE_PARSE_ERROR";
    /**
     * Raised when an NgModule contains an invalid reference in `declarations`.
     */
    ErrorCode[ErrorCode["NGMODULE_INVALID_DECLARATION"] = 6001] = "NGMODULE_INVALID_DECLARATION";
    /**
     * Raised when an NgModule contains an invalid type in `imports`.
     */
    ErrorCode[ErrorCode["NGMODULE_INVALID_IMPORT"] = 6002] = "NGMODULE_INVALID_IMPORT";
    /**
     * Raised when an NgModule contains an invalid type in `exports`.
     */
    ErrorCode[ErrorCode["NGMODULE_INVALID_EXPORT"] = 6003] = "NGMODULE_INVALID_EXPORT";
    /**
     * Raised when an NgModule contains a type in `exports` which is neither in `declarations` nor
     * otherwise imported.
     */
    ErrorCode[ErrorCode["NGMODULE_INVALID_REEXPORT"] = 6004] = "NGMODULE_INVALID_REEXPORT";
    /**
     * Raised when a `ModuleWithProviders` with a missing
     * generic type argument is passed into an `NgModule`.
     */
    ErrorCode[ErrorCode["NGMODULE_MODULE_WITH_PROVIDERS_MISSING_GENERIC"] = 6005] = "NGMODULE_MODULE_WITH_PROVIDERS_MISSING_GENERIC";
    /**
     * Raised when an NgModule exports multiple directives/pipes of the same name and the compiler
     * attempts to generate private re-exports within the NgModule file.
     */
    ErrorCode[ErrorCode["NGMODULE_REEXPORT_NAME_COLLISION"] = 6006] = "NGMODULE_REEXPORT_NAME_COLLISION";
    /**
     * Raised when a directive/pipe is part of the declarations of two or more NgModules.
     */
    ErrorCode[ErrorCode["NGMODULE_DECLARATION_NOT_UNIQUE"] = 6007] = "NGMODULE_DECLARATION_NOT_UNIQUE";
    /**
     * Raised when a standalone directive/pipe is part of the declarations of an NgModule.
     */
    ErrorCode[ErrorCode["NGMODULE_DECLARATION_IS_STANDALONE"] = 6008] = "NGMODULE_DECLARATION_IS_STANDALONE";
    /**
     * Raised when a standalone component is part of the bootstrap list of an NgModule.
     */
    ErrorCode[ErrorCode["NGMODULE_BOOTSTRAP_IS_STANDALONE"] = 6009] = "NGMODULE_BOOTSTRAP_IS_STANDALONE";
    /**
     * Indicates that an NgModule is declared with `id: module.id`. This is an anti-pattern that is
     * disabled explicitly in the compiler, that was originally based on a misunderstanding of
     * `NgModule.id`.
     */
    ErrorCode[ErrorCode["WARN_NGMODULE_ID_UNNECESSARY"] = 6100] = "WARN_NGMODULE_ID_UNNECESSARY";
    /**
     * 6999 was previously assigned to NGMODULE_VE_DEPENDENCY_ON_IVY_LIB
     * To prevent any confusion, let's not reassign it.
     */
    /**
     * An element name failed validation against the DOM schema.
     */
    ErrorCode[ErrorCode["SCHEMA_INVALID_ELEMENT"] = 8001] = "SCHEMA_INVALID_ELEMENT";
    /**
     * An element's attribute name failed validation against the DOM schema.
     */
    ErrorCode[ErrorCode["SCHEMA_INVALID_ATTRIBUTE"] = 8002] = "SCHEMA_INVALID_ATTRIBUTE";
    /**
     * No matching directive was found for a `#ref="target"` expression.
     */
    ErrorCode[ErrorCode["MISSING_REFERENCE_TARGET"] = 8003] = "MISSING_REFERENCE_TARGET";
    /**
     * No matching pipe was found for a
     */
    ErrorCode[ErrorCode["MISSING_PIPE"] = 8004] = "MISSING_PIPE";
    /**
     * The left-hand side of an assignment expression was a template variable. Effectively, the
     * template looked like:
     *
     * ```
     * <ng-template let-something>
     *   <button (click)="something = ...">...</button>
     * </ng-template>
     * ```
     *
     * Template variables are read-only.
     */
    ErrorCode[ErrorCode["WRITE_TO_READ_ONLY_VARIABLE"] = 8005] = "WRITE_TO_READ_ONLY_VARIABLE";
    /**
     * A template variable was declared twice. For example:
     *
     * ```html
     * <div *ngFor="let i of items; let i = index">
     * </div>
     * ```
     */
    ErrorCode[ErrorCode["DUPLICATE_VARIABLE_DECLARATION"] = 8006] = "DUPLICATE_VARIABLE_DECLARATION";
    /**
     * A template has a two way binding (two bindings created by a single syntactical element)
     * in which the input and output are going to different places.
     */
    ErrorCode[ErrorCode["SPLIT_TWO_WAY_BINDING"] = 8007] = "SPLIT_TWO_WAY_BINDING";
    /**
     * A directive usage isn't binding to one or more required inputs.
     */
    ErrorCode[ErrorCode["MISSING_REQUIRED_INPUTS"] = 8008] = "MISSING_REQUIRED_INPUTS";
    /**
     * The tracking expression of a `for` loop block is accessing a variable that is unavailable,
     * for example:
     *
     * ```
     * <ng-template let-ref>
     *   @for (item of items; track ref) {}
     * </ng-template>
     * ```
     */
    ErrorCode[ErrorCode["ILLEGAL_FOR_LOOP_TRACK_ACCESS"] = 8009] = "ILLEGAL_FOR_LOOP_TRACK_ACCESS";
    /**
     * The trigger of a `defer` block cannot access its trigger element,
     * either because it doesn't exist or it's in a different view.
     *
     * ```
     * @defer (on interaction(trigger)) {...}
     *
     * <ng-template>
     *   <button #trigger></button>
     * </ng-template>
     * ```
     */
    ErrorCode[ErrorCode["INACCESSIBLE_DEFERRED_TRIGGER_ELEMENT"] = 8010] = "INACCESSIBLE_DEFERRED_TRIGGER_ELEMENT";
    /**
     * A control flow node is projected at the root of a component and is preventing its direct
     * descendants from being projected, because it has more than one root node.
     *
     * ```
     * <comp>
     *  @if (expr) {
     *    <div projectsIntoSlot></div>
     *    Text preventing the div from being projected
     *  }
     * </comp>
     * ```
     */
    ErrorCode[ErrorCode["CONTROL_FLOW_PREVENTING_CONTENT_PROJECTION"] = 8011] = "CONTROL_FLOW_PREVENTING_CONTENT_PROJECTION";
    /**
     * A pipe imported via `@Component.deferredImports` is
     * used outside of a `@defer` block in a template.
     */
    ErrorCode[ErrorCode["DEFERRED_PIPE_USED_EAGERLY"] = 8012] = "DEFERRED_PIPE_USED_EAGERLY";
    /**
     * A directive/component imported via `@Component.deferredImports` is
     * used outside of a `@defer` block in a template.
     */
    ErrorCode[ErrorCode["DEFERRED_DIRECTIVE_USED_EAGERLY"] = 8013] = "DEFERRED_DIRECTIVE_USED_EAGERLY";
    /**
     * A directive/component/pipe imported via `@Component.deferredImports` is
     * also included into the `@Component.imports` list.
     */
    ErrorCode[ErrorCode["DEFERRED_DEPENDENCY_IMPORTED_EAGERLY"] = 8014] = "DEFERRED_DEPENDENCY_IMPORTED_EAGERLY";
    /** An expression is trying to write to an `@let` declaration. */
    ErrorCode[ErrorCode["ILLEGAL_LET_WRITE"] = 8015] = "ILLEGAL_LET_WRITE";
    /** An expression is trying to read an `@let` before it has been defined. */
    ErrorCode[ErrorCode["LET_USED_BEFORE_DEFINITION"] = 8016] = "LET_USED_BEFORE_DEFINITION";
    /** A `@let` declaration conflicts with another symbol in the same scope. */
    ErrorCode[ErrorCode["CONFLICTING_LET_DECLARATION"] = 8017] = "CONFLICTING_LET_DECLARATION";
    /**
     * A two way binding in a template has an incorrect syntax,
     * parentheses outside brackets. For example:
     *
     * ```
     * <div ([foo])="bar" />
     * ```
     */
    ErrorCode[ErrorCode["INVALID_BANANA_IN_BOX"] = 8101] = "INVALID_BANANA_IN_BOX";
    /**
     * The left side of a nullish coalescing operation is not nullable.
     *
     * ```
     * {{ foo ?? bar }}
     * ```
     * When the type of foo doesn't include `null` or `undefined`.
     */
    ErrorCode[ErrorCode["NULLISH_COALESCING_NOT_NULLABLE"] = 8102] = "NULLISH_COALESCING_NOT_NULLABLE";
    /**
     * A known control flow directive (e.g. `*ngIf`) is used in a template,
     * but the `CommonModule` is not imported.
     */
    ErrorCode[ErrorCode["MISSING_CONTROL_FLOW_DIRECTIVE"] = 8103] = "MISSING_CONTROL_FLOW_DIRECTIVE";
    /**
     * A text attribute is not interpreted as a binding but likely intended to be.
     *
     * For example:
     * ```
     * <div
     *   attr.x="value"
     *   class.blue="true"
     *   style.margin-right.px="5">
     * </div>
     * ```
     *
     * All of the above attributes will just be static text attributes and will not be interpreted as
     * bindings by the compiler.
     */
    ErrorCode[ErrorCode["TEXT_ATTRIBUTE_NOT_BINDING"] = 8104] = "TEXT_ATTRIBUTE_NOT_BINDING";
    /**
     * NgForOf is used in a template, but the user forgot to include let
     * in their statement.
     *
     * For example:
     * ```
     * <ul><li *ngFor="item of items">{{item["name"]}};</li></ul>
     * ```
     */
    ErrorCode[ErrorCode["MISSING_NGFOROF_LET"] = 8105] = "MISSING_NGFOROF_LET";
    /**
     * Indicates that the binding suffix is not supported
     *
     * Style bindings support suffixes like `style.width.px`, `.em`, and `.%`.
     * These suffixes are _not_ supported for attribute bindings.
     *
     * For example `[attr.width.px]="5"` becomes `width.px="5"` when bound.
     * This is almost certainly unintentional and this error is meant to
     * surface this mistake to the developer.
     */
    ErrorCode[ErrorCode["SUFFIX_NOT_SUPPORTED"] = 8106] = "SUFFIX_NOT_SUPPORTED";
    /**
     * The left side of an optional chain operation is not nullable.
     *
     * ```
     * {{ foo?.bar }}
     * {{ foo?.['bar'] }}
     * {{ foo?.() }}
     * ```
     * When the type of foo doesn't include `null` or `undefined`.
     */
    ErrorCode[ErrorCode["OPTIONAL_CHAIN_NOT_NULLABLE"] = 8107] = "OPTIONAL_CHAIN_NOT_NULLABLE";
    /**
     * `ngSkipHydration` should not be a binding (it should be a static attribute).
     *
     * For example:
     * ```
     * <my-cmp [ngSkipHydration]="someTruthyVar" />
     * ```
     *
     * `ngSkipHydration` cannot be a binding and can not have values other than "true" or an empty
     * value
     */
    ErrorCode[ErrorCode["SKIP_HYDRATION_NOT_STATIC"] = 8108] = "SKIP_HYDRATION_NOT_STATIC";
    /**
     * Signal functions should be invoked when interpolated in templates.
     *
     * For example:
     * ```
     * {{ mySignal() }}
     * ```
     */
    ErrorCode[ErrorCode["INTERPOLATED_SIGNAL_NOT_INVOKED"] = 8109] = "INTERPOLATED_SIGNAL_NOT_INVOKED";
    /**
     * Initializer-based APIs can only be invoked from inside of an initializer.
     *
     * ```
     * // Allowed
     * myInput = input();
     *
     * // Not allowed
     * function myInput() {
     *   return input();
     * }
     * ```
     */
    ErrorCode[ErrorCode["UNSUPPORTED_INITIALIZER_API_USAGE"] = 8110] = "UNSUPPORTED_INITIALIZER_API_USAGE";
    /**
     * A function in an event binding is not called.
     *
     * For example:
     * ```
     * <button (click)="myFunc"></button>
     * ```
     *
     * This will not call `myFunc` when the button is clicked. Instead, it should be
     * `<button (click)="myFunc()"></button>`.
     */
    ErrorCode[ErrorCode["UNINVOKED_FUNCTION_IN_EVENT_BINDING"] = 8111] = "UNINVOKED_FUNCTION_IN_EVENT_BINDING";
    /**
     * A `@let` declaration in a template isn't used.
     *
     * For example:
     * ```
     * @let used = 1; <!-- Not an error -->
     * @let notUsed = 2; <!-- Error -->
     *
     * {{used}}
     * ```
     */
    ErrorCode[ErrorCode["UNUSED_LET_DECLARATION"] = 8112] = "UNUSED_LET_DECLARATION";
    /**
     * A symbol referenced in `@Component.imports` isn't being used within the template.
     */
    ErrorCode[ErrorCode["UNUSED_STANDALONE_IMPORTS"] = 8113] = "UNUSED_STANDALONE_IMPORTS";
    /**
     * The template type-checking engine would need to generate an inline type check block for a
     * component, but the current type-checking environment doesn't support it.
     */
    ErrorCode[ErrorCode["INLINE_TCB_REQUIRED"] = 8900] = "INLINE_TCB_REQUIRED";
    /**
     * The template type-checking engine would need to generate an inline type constructor for a
     * directive or component, but the current type-checking environment doesn't support it.
     */
    ErrorCode[ErrorCode["INLINE_TYPE_CTOR_REQUIRED"] = 8901] = "INLINE_TYPE_CTOR_REQUIRED";
    /**
     * An injectable already has a `ɵprov` property.
     */
    ErrorCode[ErrorCode["INJECTABLE_DUPLICATE_PROV"] = 9001] = "INJECTABLE_DUPLICATE_PROV";
    // 10XXX error codes are reserved for diagnostics with categories other than
    // `ts.DiagnosticCategory.Error`. These diagnostics are generated by the compiler when configured
    // to do so by a tool such as the Language Service, or by the Language Service itself.
    /**
     * Suggest users to enable `strictTemplates` to make use of full capabilities
     * provided by Angular language service.
     */
    ErrorCode[ErrorCode["SUGGEST_STRICT_TEMPLATES"] = 10001] = "SUGGEST_STRICT_TEMPLATES";
    /**
     * Indicates that a particular structural directive provides advanced type narrowing
     * functionality, but the current template type-checking configuration does not allow its usage in
     * type inference.
     */
    ErrorCode[ErrorCode["SUGGEST_SUBOPTIMAL_TYPE_INFERENCE"] = 10002] = "SUGGEST_SUBOPTIMAL_TYPE_INFERENCE";
    /**
     * In local compilation mode a const is required to be resolved statically but cannot be so since
     * it is imported from a file outside of the compilation unit. This usually happens with const
     * being used as Angular decorators parameters such as `@Component.template`,
     * `@HostListener.eventName`, etc.
     */
    ErrorCode[ErrorCode["LOCAL_COMPILATION_UNRESOLVED_CONST"] = 11001] = "LOCAL_COMPILATION_UNRESOLVED_CONST";
    /**
     * In local compilation mode a certain expression or syntax is not supported. This is usually
     * because the expression/syntax is not very common and so we did not add support for it yet. This
     * can be changed in the future and support for more expressions could be added if need be.
     * Meanwhile, this error is thrown to indicate a current unavailability.
     */
    ErrorCode[ErrorCode["LOCAL_COMPILATION_UNSUPPORTED_EXPRESSION"] = 11003] = "LOCAL_COMPILATION_UNSUPPORTED_EXPRESSION";
})(ErrorCode || (ErrorCode = {}));

/**
 * Contains a set of error messages that have detailed guides at angular.io.
 * Full list of available error guides can be found at https://angular.dev/errors
 */
new Set([
    ErrorCode.DECORATOR_ARG_NOT_LITERAL,
    ErrorCode.IMPORT_CYCLE_DETECTED,
    ErrorCode.PARAM_MISSING_TOKEN,
    ErrorCode.SCHEMA_INVALID_ELEMENT,
    ErrorCode.SCHEMA_INVALID_ATTRIBUTE,
    ErrorCode.MISSING_REFERENCE_TARGET,
    ErrorCode.COMPONENT_INVALID_SHADOW_DOM_SELECTOR,
    ErrorCode.WARN_NGMODULE_ID_UNNECESSARY,
]);

/**
 * Enum holding the name of each extended template diagnostic. The name is used as a user-meaningful
 * value for configuring the diagnostic in the project's options.
 *
 * See the corresponding `ErrorCode` for documentation about each specific error.
 * packages/compiler-cli/src/ngtsc/diagnostics/src/error_code.ts
 *
 * @publicApi
 */
var ExtendedTemplateDiagnosticName;
(function (ExtendedTemplateDiagnosticName) {
    ExtendedTemplateDiagnosticName["INVALID_BANANA_IN_BOX"] = "invalidBananaInBox";
    ExtendedTemplateDiagnosticName["NULLISH_COALESCING_NOT_NULLABLE"] = "nullishCoalescingNotNullable";
    ExtendedTemplateDiagnosticName["OPTIONAL_CHAIN_NOT_NULLABLE"] = "optionalChainNotNullable";
    ExtendedTemplateDiagnosticName["MISSING_CONTROL_FLOW_DIRECTIVE"] = "missingControlFlowDirective";
    ExtendedTemplateDiagnosticName["TEXT_ATTRIBUTE_NOT_BINDING"] = "textAttributeNotBinding";
    ExtendedTemplateDiagnosticName["UNINVOKED_FUNCTION_IN_EVENT_BINDING"] = "uninvokedFunctionInEventBinding";
    ExtendedTemplateDiagnosticName["MISSING_NGFOROF_LET"] = "missingNgForOfLet";
    ExtendedTemplateDiagnosticName["SUFFIX_NOT_SUPPORTED"] = "suffixNotSupported";
    ExtendedTemplateDiagnosticName["SKIP_HYDRATION_NOT_STATIC"] = "skipHydrationNotStatic";
    ExtendedTemplateDiagnosticName["INTERPOLATED_SIGNAL_NOT_INVOKED"] = "interpolatedSignalNotInvoked";
    ExtendedTemplateDiagnosticName["CONTROL_FLOW_PREVENTING_CONTENT_PROJECTION"] = "controlFlowPreventingContentProjection";
    ExtendedTemplateDiagnosticName["UNUSED_LET_DECLARATION"] = "unusedLetDeclaration";
    ExtendedTemplateDiagnosticName["UNUSED_STANDALONE_IMPORTS"] = "unusedStandaloneImports";
})(ExtendedTemplateDiagnosticName || (ExtendedTemplateDiagnosticName = {}));

/// <reference types="node" />
// G3-ESM-MARKER: G3 uses CommonJS, but externally everything in ESM.
// CommonJS/ESM interop for determining the current file name and containing dir.
const isCommonJS = typeof __filename !== 'undefined';
const currentFileUrl = isCommonJS ? null : (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('output-migration.js', document.baseURI).href));
isCommonJS ? __filename : url.fileURLToPath(currentFileUrl);

function getSourceFile(node) {
    // In certain transformation contexts, `ts.Node.getSourceFile()` can actually return `undefined`,
    // despite the type signature not allowing it. In that event, get the `ts.SourceFile` via the
    // original node instead (which works).
    const directSf = node.getSourceFile();
    return directSf !== undefined ? directSf : ts__default["default"].getOriginalNode(node).getSourceFile();
}
function identifierOfNode(decl) {
    if (decl.name !== undefined && ts__default["default"].isIdentifier(decl.name)) {
        return decl.name;
    }
    else {
        return null;
    }
}
function nodeDebugInfo(node) {
    const sf = getSourceFile(node);
    const { line, character } = ts__default["default"].getLineAndCharacterOfPosition(sf, node.pos);
    return `[${sf.fileName}: ${ts__default["default"].SyntaxKind[node.kind]} @ ${line}:${character}]`;
}

/**
 * Flags which alter the imports generated by the `ReferenceEmitter`.
 */
var ImportFlags;
(function (ImportFlags) {
    ImportFlags[ImportFlags["None"] = 0] = "None";
    /**
     * Force the generation of a new import when generating a reference, even if an identifier already
     * exists in the target file which could be used instead.
     *
     * This is sometimes required if there's a risk TypeScript might remove imports during emit.
     */
    ImportFlags[ImportFlags["ForceNewImport"] = 1] = "ForceNewImport";
    /**
     * Don't make use of any aliasing information when emitting a reference.
     *
     * This is sometimes required if emitting into a context where generated references will be fed
     * into TypeScript and type-checked (such as in template type-checking).
     */
    ImportFlags[ImportFlags["NoAliasing"] = 2] = "NoAliasing";
    /**
     * Indicates that an import to a type-only declaration is allowed.
     *
     * For references that occur in type-positions, the referred declaration may be a type-only
     * declaration that is not retained during emit. Including this flag allows to emit references to
     * type-only declarations as used in e.g. template type-checking.
     */
    ImportFlags[ImportFlags["AllowTypeImports"] = 4] = "AllowTypeImports";
    /**
     * Indicates that importing from a declaration file using a relative import path is allowed.
     *
     * The generated imports should normally use module specifiers that are valid for use in
     * production code, where arbitrary relative imports into e.g. node_modules are not allowed. For
     * template type-checking code it is however acceptable to use relative imports, as such files are
     * never emitted to JS code.
     *
     * Non-declaration files have to be contained within a configured `rootDir` so using relative
     * paths may not be possible for those, hence this flag only applies when importing from a
     * declaration file.
     */
    ImportFlags[ImportFlags["AllowRelativeDtsImports"] = 8] = "AllowRelativeDtsImports";
    /**
     * Indicates that references coming from ambient imports are allowed.
     */
    ImportFlags[ImportFlags["AllowAmbientReferences"] = 16] = "AllowAmbientReferences";
})(ImportFlags || (ImportFlags = {}));

const patchedReferencedAliasesSymbol = Symbol('patchedReferencedAliases');
/**
 * Patches the alias declaration reference resolution for a given transformation context
 * so that TypeScript knows about the specified alias declarations being referenced.
 *
 * This exists because TypeScript performs analysis of import usage before transformers
 * run and doesn't refresh its state after transformations. This means that imports
 * for symbols used as constructor types are elided due to their original type-only usage.
 *
 * In reality though, since we downlevel decorators and constructor parameters, we want
 * these symbols to be retained in the JavaScript output as they will be used as values
 * at runtime. We can instruct TypeScript to preserve imports for such identifiers by
 * creating a mutable clone of a given import specifier/clause or namespace, but that
 * has the downside of preserving the full import in the JS output. See:
 * https://github.com/microsoft/TypeScript/blob/3eaa7c65f6f076a08a5f7f1946fd0df7c7430259/src/compiler/transformers/ts.ts#L242-L250.
 *
 * This is a trick the CLI used in the past  for constructor parameter downleveling in JIT:
 * https://github.com/angular/angular-cli/blob/b3f84cc5184337666ce61c07b7b9df418030106f/packages/ngtools/webpack/src/transformers/ctor-parameters.ts#L323-L325
 * The trick is not ideal though as it preserves the full import (as outlined before), and it
 * results in a slow-down due to the type checker being involved multiple times. The CLI worked
 * around this import preserving issue by having another complex post-process step that detects and
 * elides unused imports. Note that these unused imports could cause unused chunks being generated
 * by Webpack if the application or library is not marked as side-effect free.
 *
 * This is not ideal though, as we basically re-implement the complex import usage resolution
 * from TypeScript. We can do better by letting TypeScript do the import eliding, but providing
 * information about the alias declarations (e.g. import specifiers) that should not be elided
 * because they are actually referenced (as they will now appear in static properties).
 *
 * More information about these limitations with transformers can be found in:
 *   1. https://github.com/Microsoft/TypeScript/issues/17552.
 *   2. https://github.com/microsoft/TypeScript/issues/17516.
 *   3. https://github.com/angular/tsickle/issues/635.
 *
 * The patch we apply to tell TypeScript about actual referenced aliases (i.e. imported symbols),
 * matches conceptually with the logic that runs internally in TypeScript when the
 * `emitDecoratorMetadata` flag is enabled. TypeScript basically surfaces the same problem and
 * solves it conceptually the same way, but obviously doesn't need to access an internal API.
 *
 * The set that is returned by this function is meant to be filled with import declaration nodes
 * that have been referenced in a value-position by the transform, such the installed patch can
 * ensure that those import declarations are not elided.
 *
 * See below. Note that this uses sourcegraph as the TypeScript checker file doesn't display on
 * Github.
 * https://sourcegraph.com/github.com/microsoft/TypeScript@3eaa7c65f6f076a08a5f7f1946fd0df7c7430259/-/blob/src/compiler/checker.ts#L31219-31257
 */
function loadIsReferencedAliasDeclarationPatch(context) {
    // If the `getEmitResolver` method is not available, TS most likely changed the
    // internal structure of the transformation context. We will abort gracefully.
    if (!isTransformationContextWithEmitResolver(context)) {
        throwIncompatibleTransformationContextError();
    }
    const emitResolver = context.getEmitResolver();
    // The emit resolver may have been patched already, in which case we return the set of referenced
    // aliases that was created when the patch was first applied.
    // See https://github.com/angular/angular/issues/40276.
    const existingReferencedAliases = emitResolver[patchedReferencedAliasesSymbol];
    if (existingReferencedAliases !== undefined) {
        return existingReferencedAliases;
    }
    const originalIsReferencedAliasDeclaration = emitResolver.isReferencedAliasDeclaration;
    // If the emit resolver does not have a function called `isReferencedAliasDeclaration`, then
    // we abort gracefully as most likely TS changed the internal structure of the emit resolver.
    if (originalIsReferencedAliasDeclaration === undefined) {
        throwIncompatibleTransformationContextError();
    }
    const referencedAliases = new Set();
    emitResolver.isReferencedAliasDeclaration = function (node, ...args) {
        if (isAliasImportDeclaration(node) && referencedAliases.has(node)) {
            return true;
        }
        return originalIsReferencedAliasDeclaration.call(emitResolver, node, ...args);
    };
    return (emitResolver[patchedReferencedAliasesSymbol] = referencedAliases);
}
/**
 * Gets whether a given node corresponds to an import alias declaration. Alias
 * declarations can be import specifiers, namespace imports or import clauses
 * as these do not declare an actual symbol but just point to a target declaration.
 */
function isAliasImportDeclaration(node) {
    return ts__default["default"].isImportSpecifier(node) || ts__default["default"].isNamespaceImport(node) || ts__default["default"].isImportClause(node);
}
/** Whether the transformation context exposes its emit resolver. */
function isTransformationContextWithEmitResolver(context) {
    return context.getEmitResolver !== undefined;
}
/**
 * Throws an error about an incompatible TypeScript version for which the alias
 * declaration reference resolution could not be monkey-patched. The error will
 * also propose potential solutions that can be applied by developers.
 */
function throwIncompatibleTransformationContextError() {
    throw Error('Angular compiler is incompatible with this version of the TypeScript compiler.\n\n' +
        'If you recently updated TypeScript and this issue surfaces now, consider downgrading.\n\n' +
        'Please report an issue on the Angular repositories when this issue ' +
        'surfaces and you are using a supposedly compatible TypeScript version.');
}

function isDecoratorIdentifier(exp) {
    return (ts__default["default"].isIdentifier(exp) ||
        (ts__default["default"].isPropertyAccessExpression(exp) &&
            ts__default["default"].isIdentifier(exp.expression) &&
            ts__default["default"].isIdentifier(exp.name)));
}
/**
 * An enumeration of possible kinds of class members.
 */
var ClassMemberKind;
(function (ClassMemberKind) {
    ClassMemberKind[ClassMemberKind["Constructor"] = 0] = "Constructor";
    ClassMemberKind[ClassMemberKind["Getter"] = 1] = "Getter";
    ClassMemberKind[ClassMemberKind["Setter"] = 2] = "Setter";
    ClassMemberKind[ClassMemberKind["Property"] = 3] = "Property";
    ClassMemberKind[ClassMemberKind["Method"] = 4] = "Method";
})(ClassMemberKind || (ClassMemberKind = {}));
/** Possible access levels of a class member. */
var ClassMemberAccessLevel;
(function (ClassMemberAccessLevel) {
    ClassMemberAccessLevel[ClassMemberAccessLevel["PublicWritable"] = 0] = "PublicWritable";
    ClassMemberAccessLevel[ClassMemberAccessLevel["PublicReadonly"] = 1] = "PublicReadonly";
    ClassMemberAccessLevel[ClassMemberAccessLevel["Protected"] = 2] = "Protected";
    ClassMemberAccessLevel[ClassMemberAccessLevel["Private"] = 3] = "Private";
    ClassMemberAccessLevel[ClassMemberAccessLevel["EcmaScriptPrivate"] = 4] = "EcmaScriptPrivate";
})(ClassMemberAccessLevel || (ClassMemberAccessLevel = {}));
/** Indicates that a declaration is referenced through an ambient type. */
const AmbientImport = {};

/**
 * Potentially convert a `ts.TypeNode` to a `TypeValueReference`, which indicates how to use the
 * type given in the `ts.TypeNode` in a value position.
 *
 * This can return `null` if the `typeNode` is `null`, if it does not refer to a symbol with a value
 * declaration, or if it is not possible to statically understand.
 */
function typeToValue(typeNode, checker, isLocalCompilation) {
    // It's not possible to get a value expression if the parameter doesn't even have a type.
    if (typeNode === null) {
        return missingType();
    }
    if (!ts__default["default"].isTypeReferenceNode(typeNode)) {
        return unsupportedType(typeNode);
    }
    const symbols = resolveTypeSymbols(typeNode, checker);
    if (symbols === null) {
        return unknownReference(typeNode);
    }
    const { local, decl } = symbols;
    // It's only valid to convert a type reference to a value reference if the type actually
    // has a value declaration associated with it. Note that const enums are an exception,
    // because while they do have a value declaration, they don't exist at runtime.
    if (decl.valueDeclaration === undefined || decl.flags & ts__default["default"].SymbolFlags.ConstEnum) {
        let typeOnlyDecl = null;
        if (decl.declarations !== undefined && decl.declarations.length > 0) {
            typeOnlyDecl = decl.declarations[0];
        }
        // In local compilation mode a declaration is considered invalid only if it is a type related
        // declaration.
        if (!isLocalCompilation ||
            (typeOnlyDecl &&
                [
                    ts__default["default"].SyntaxKind.TypeParameter,
                    ts__default["default"].SyntaxKind.TypeAliasDeclaration,
                    ts__default["default"].SyntaxKind.InterfaceDeclaration,
                ].includes(typeOnlyDecl.kind))) {
            return noValueDeclaration(typeNode, typeOnlyDecl);
        }
    }
    // The type points to a valid value declaration. Rewrite the TypeReference into an
    // Expression which references the value pointed to by the TypeReference, if possible.
    // Look at the local `ts.Symbol`'s declarations and see if it comes from an import
    // statement. If so, extract the module specifier and the name of the imported type.
    const firstDecl = local.declarations && local.declarations[0];
    if (firstDecl !== undefined) {
        if (ts__default["default"].isImportClause(firstDecl) && firstDecl.name !== undefined) {
            // This is a default import.
            //   import Foo from 'foo';
            if (firstDecl.isTypeOnly) {
                // Type-only imports cannot be represented as value.
                return typeOnlyImport(typeNode, firstDecl);
            }
            if (!ts__default["default"].isImportDeclaration(firstDecl.parent)) {
                return unsupportedType(typeNode);
            }
            return {
                kind: 0 /* TypeValueReferenceKind.LOCAL */,
                expression: firstDecl.name,
                defaultImportStatement: firstDecl.parent,
            };
        }
        else if (ts__default["default"].isImportSpecifier(firstDecl)) {
            // The symbol was imported by name
            //   import {Foo} from 'foo';
            // or
            //   import {Foo as Bar} from 'foo';
            if (firstDecl.isTypeOnly) {
                // The import specifier can't be type-only (e.g. `import {type Foo} from '...')`.
                return typeOnlyImport(typeNode, firstDecl);
            }
            if (firstDecl.parent.parent.isTypeOnly) {
                // The import specifier can't be inside a type-only import clause
                // (e.g. `import type {Foo} from '...')`.
                return typeOnlyImport(typeNode, firstDecl.parent.parent);
            }
            // Determine the name to import (`Foo`) from the import specifier, as the symbol names of
            // the imported type could refer to a local alias (like `Bar` in the example above).
            const importedName = (firstDecl.propertyName || firstDecl.name).text;
            // The first symbol name refers to the local name, which is replaced by `importedName` above.
            // Any remaining symbol names make up the complete path to the value.
            const [_localName, ...nestedPath] = symbols.symbolNames;
            const importDeclaration = firstDecl.parent.parent.parent;
            if (!ts__default["default"].isImportDeclaration(importDeclaration)) {
                return unsupportedType(typeNode);
            }
            const moduleName = extractModuleName(importDeclaration);
            return {
                kind: 1 /* TypeValueReferenceKind.IMPORTED */,
                valueDeclaration: decl.valueDeclaration ?? null,
                moduleName,
                importedName,
                nestedPath,
            };
        }
        else if (ts__default["default"].isNamespaceImport(firstDecl)) {
            // The import is a namespace import
            //   import * as Foo from 'foo';
            if (firstDecl.parent.isTypeOnly) {
                // Type-only imports cannot be represented as value.
                return typeOnlyImport(typeNode, firstDecl.parent);
            }
            if (symbols.symbolNames.length === 1) {
                // The type refers to the namespace itself, which cannot be represented as a value.
                return namespaceImport(typeNode, firstDecl.parent);
            }
            // The first symbol name refers to the local name of the namespace, which is is discarded
            // as a new namespace import will be generated. This is followed by the symbol name that needs
            // to be imported and any remaining names that constitute the complete path to the value.
            const [_ns, importedName, ...nestedPath] = symbols.symbolNames;
            const importDeclaration = firstDecl.parent.parent;
            if (!ts__default["default"].isImportDeclaration(importDeclaration)) {
                return unsupportedType(typeNode);
            }
            const moduleName = extractModuleName(importDeclaration);
            return {
                kind: 1 /* TypeValueReferenceKind.IMPORTED */,
                valueDeclaration: decl.valueDeclaration ?? null,
                moduleName,
                importedName,
                nestedPath,
            };
        }
    }
    // If the type is not imported, the type reference can be converted into an expression as is.
    const expression = typeNodeToValueExpr(typeNode);
    if (expression !== null) {
        return {
            kind: 0 /* TypeValueReferenceKind.LOCAL */,
            expression,
            defaultImportStatement: null,
        };
    }
    else {
        return unsupportedType(typeNode);
    }
}
function unsupportedType(typeNode) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 5 /* ValueUnavailableKind.UNSUPPORTED */, typeNode },
    };
}
function noValueDeclaration(typeNode, decl) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 1 /* ValueUnavailableKind.NO_VALUE_DECLARATION */, typeNode, decl },
    };
}
function typeOnlyImport(typeNode, node) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 2 /* ValueUnavailableKind.TYPE_ONLY_IMPORT */, typeNode, node },
    };
}
function unknownReference(typeNode) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 3 /* ValueUnavailableKind.UNKNOWN_REFERENCE */, typeNode },
    };
}
function namespaceImport(typeNode, importClause) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 4 /* ValueUnavailableKind.NAMESPACE */, typeNode, importClause },
    };
}
function missingType() {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 0 /* ValueUnavailableKind.MISSING_TYPE */ },
    };
}
/**
 * Attempt to extract a `ts.Expression` that's equivalent to a `ts.TypeNode`, as the two have
 * different AST shapes but can reference the same symbols.
 *
 * This will return `null` if an equivalent expression cannot be constructed.
 */
function typeNodeToValueExpr(node) {
    if (ts__default["default"].isTypeReferenceNode(node)) {
        return entityNameToValue(node.typeName);
    }
    else {
        return null;
    }
}
/**
 * Resolve a `TypeReference` node to the `ts.Symbol`s for both its declaration and its local source.
 *
 * In the event that the `TypeReference` refers to a locally declared symbol, these will be the
 * same. If the `TypeReference` refers to an imported symbol, then `decl` will be the fully resolved
 * `ts.Symbol` of the referenced symbol. `local` will be the `ts.Symbol` of the `ts.Identifier`
 * which points to the import statement by which the symbol was imported.
 *
 * All symbol names that make up the type reference are returned left-to-right into the
 * `symbolNames` array, which is guaranteed to include at least one entry.
 */
function resolveTypeSymbols(typeRef, checker) {
    const typeName = typeRef.typeName;
    // typeRefSymbol is the ts.Symbol of the entire type reference.
    const typeRefSymbol = checker.getSymbolAtLocation(typeName);
    if (typeRefSymbol === undefined) {
        return null;
    }
    // `local` is the `ts.Symbol` for the local `ts.Identifier` for the type.
    // If the type is actually locally declared or is imported by name, for example:
    //   import {Foo} from './foo';
    // then it'll be the same as `typeRefSymbol`.
    //
    // If the type is imported via a namespace import, for example:
    //   import * as foo from './foo';
    // and then referenced as:
    //   constructor(f: foo.Foo)
    // then `local` will be the `ts.Symbol` of `foo`, whereas `typeRefSymbol` will be the `ts.Symbol`
    // of `foo.Foo`. This allows tracking of the import behind whatever type reference exists.
    let local = typeRefSymbol;
    // Destructure a name like `foo.X.Y.Z` as follows:
    // - in `leftMost`, the `ts.Identifier` of the left-most name (`foo`) in the qualified name.
    //   This identifier is used to resolve the `ts.Symbol` for `local`.
    // - in `symbolNames`, all names involved in the qualified path, or a single symbol name if the
    //   type is not qualified.
    let leftMost = typeName;
    const symbolNames = [];
    while (ts__default["default"].isQualifiedName(leftMost)) {
        symbolNames.unshift(leftMost.right.text);
        leftMost = leftMost.left;
    }
    symbolNames.unshift(leftMost.text);
    if (leftMost !== typeName) {
        const localTmp = checker.getSymbolAtLocation(leftMost);
        if (localTmp !== undefined) {
            local = localTmp;
        }
    }
    // De-alias the top-level type reference symbol to get the symbol of the actual declaration.
    let decl = typeRefSymbol;
    if (typeRefSymbol.flags & ts__default["default"].SymbolFlags.Alias) {
        decl = checker.getAliasedSymbol(typeRefSymbol);
    }
    return { local, decl, symbolNames };
}
function entityNameToValue(node) {
    if (ts__default["default"].isQualifiedName(node)) {
        const left = entityNameToValue(node.left);
        return left !== null ? ts__default["default"].factory.createPropertyAccessExpression(left, node.right) : null;
    }
    else if (ts__default["default"].isIdentifier(node)) {
        const clone = ts__default["default"].setOriginalNode(ts__default["default"].factory.createIdentifier(node.text), node);
        clone.parent = node.parent;
        return clone;
    }
    else {
        return null;
    }
}
function extractModuleName(node) {
    if (!ts__default["default"].isStringLiteral(node.moduleSpecifier)) {
        throw new Error('not a module specifier');
    }
    return node.moduleSpecifier.text;
}

function isNamedClassDeclaration(node) {
    return ts__default["default"].isClassDeclaration(node) && isIdentifier(node.name);
}
function isIdentifier(node) {
    return node !== undefined && ts__default["default"].isIdentifier(node);
}

/**
 * reflector.ts implements static reflection of declarations using the TypeScript `ts.TypeChecker`.
 */
class TypeScriptReflectionHost {
    constructor(checker, isLocalCompilation = false) {
        this.checker = checker;
        this.isLocalCompilation = isLocalCompilation;
    }
    getDecoratorsOfDeclaration(declaration) {
        const decorators = ts__default["default"].canHaveDecorators(declaration)
            ? ts__default["default"].getDecorators(declaration)
            : undefined;
        return decorators !== undefined && decorators.length
            ? decorators
                .map((decorator) => this._reflectDecorator(decorator))
                .filter((dec) => dec !== null)
            : null;
    }
    getMembersOfClass(clazz) {
        const tsClazz = castDeclarationToClassOrDie(clazz);
        return tsClazz.members
            .map((member) => {
            const result = reflectClassMember(member);
            if (result === null) {
                return null;
            }
            return {
                ...result,
                decorators: this.getDecoratorsOfDeclaration(member),
            };
        })
            .filter((member) => member !== null);
    }
    getConstructorParameters(clazz) {
        const tsClazz = castDeclarationToClassOrDie(clazz);
        const isDeclaration = tsClazz.getSourceFile().isDeclarationFile;
        // For non-declaration files, we want to find the constructor with a `body`. The constructors
        // without a `body` are overloads whereas we want the implementation since it's the one that'll
        // be executed and which can have decorators. For declaration files, we take the first one that
        // we get.
        const ctor = tsClazz.members.find((member) => ts__default["default"].isConstructorDeclaration(member) && (isDeclaration || member.body !== undefined));
        if (ctor === undefined) {
            return null;
        }
        return ctor.parameters.map((node) => {
            // The name of the parameter is easy.
            const name = parameterName(node.name);
            const decorators = this.getDecoratorsOfDeclaration(node);
            // It may or may not be possible to write an expression that refers to the value side of the
            // type named for the parameter.
            let originalTypeNode = node.type || null;
            let typeNode = originalTypeNode;
            // Check if we are dealing with a simple nullable union type e.g. `foo: Foo|null`
            // and extract the type. More complex union types e.g. `foo: Foo|Bar` are not supported.
            // We also don't need to support `foo: Foo|undefined` because Angular's DI injects `null` for
            // optional tokes that don't have providers.
            if (typeNode && ts__default["default"].isUnionTypeNode(typeNode)) {
                let childTypeNodes = typeNode.types.filter((childTypeNode) => !(ts__default["default"].isLiteralTypeNode(childTypeNode) &&
                    childTypeNode.literal.kind === ts__default["default"].SyntaxKind.NullKeyword));
                if (childTypeNodes.length === 1) {
                    typeNode = childTypeNodes[0];
                }
            }
            const typeValueReference = typeToValue(typeNode, this.checker, this.isLocalCompilation);
            return {
                name,
                nameNode: node.name,
                typeValueReference,
                typeNode: originalTypeNode,
                decorators,
            };
        });
    }
    getImportOfIdentifier(id) {
        const directImport = this.getDirectImportOfIdentifier(id);
        if (directImport !== null) {
            return directImport;
        }
        else if (ts__default["default"].isQualifiedName(id.parent) && id.parent.right === id) {
            return this.getImportOfNamespacedIdentifier(id, getQualifiedNameRoot(id.parent));
        }
        else if (ts__default["default"].isPropertyAccessExpression(id.parent) && id.parent.name === id) {
            return this.getImportOfNamespacedIdentifier(id, getFarLeftIdentifier(id.parent));
        }
        else {
            return null;
        }
    }
    getExportsOfModule(node) {
        // In TypeScript code, modules are only ts.SourceFiles. Throw if the node isn't a module.
        if (!ts__default["default"].isSourceFile(node)) {
            throw new Error(`getExportsOfModule() called on non-SourceFile in TS code`);
        }
        // Reflect the module to a Symbol, and use getExportsOfModule() to get a list of exported
        // Symbols.
        const symbol = this.checker.getSymbolAtLocation(node);
        if (symbol === undefined) {
            return null;
        }
        const map = new Map();
        this.checker.getExportsOfModule(symbol).forEach((exportSymbol) => {
            // Map each exported Symbol to a Declaration and add it to the map.
            const decl = this.getDeclarationOfSymbol(exportSymbol, null);
            if (decl !== null) {
                map.set(exportSymbol.name, decl);
            }
        });
        return map;
    }
    isClass(node) {
        // For our purposes, classes are "named" ts.ClassDeclarations;
        // (`node.name` can be undefined in unnamed default exports: `default export class { ... }`).
        return isNamedClassDeclaration(node);
    }
    hasBaseClass(clazz) {
        return this.getBaseClassExpression(clazz) !== null;
    }
    getBaseClassExpression(clazz) {
        if (!(ts__default["default"].isClassDeclaration(clazz) || ts__default["default"].isClassExpression(clazz)) ||
            clazz.heritageClauses === undefined) {
            return null;
        }
        const extendsClause = clazz.heritageClauses.find((clause) => clause.token === ts__default["default"].SyntaxKind.ExtendsKeyword);
        if (extendsClause === undefined) {
            return null;
        }
        const extendsType = extendsClause.types[0];
        if (extendsType === undefined) {
            return null;
        }
        return extendsType.expression;
    }
    getDeclarationOfIdentifier(id) {
        // Resolve the identifier to a Symbol, and return the declaration of that.
        let symbol = this.checker.getSymbolAtLocation(id);
        if (symbol === undefined) {
            return null;
        }
        return this.getDeclarationOfSymbol(symbol, id);
    }
    getDefinitionOfFunction(node) {
        if (!ts__default["default"].isFunctionDeclaration(node) &&
            !ts__default["default"].isMethodDeclaration(node) &&
            !ts__default["default"].isFunctionExpression(node) &&
            !ts__default["default"].isArrowFunction(node)) {
            return null;
        }
        let body = null;
        if (node.body !== undefined) {
            // The body might be an expression if the node is an arrow function.
            body = ts__default["default"].isBlock(node.body)
                ? Array.from(node.body.statements)
                : [ts__default["default"].factory.createReturnStatement(node.body)];
        }
        const type = this.checker.getTypeAtLocation(node);
        const signatures = this.checker.getSignaturesOfType(type, ts__default["default"].SignatureKind.Call);
        return {
            node,
            body,
            signatureCount: signatures.length,
            typeParameters: node.typeParameters === undefined ? null : Array.from(node.typeParameters),
            parameters: node.parameters.map((param) => {
                const name = parameterName(param.name);
                const initializer = param.initializer || null;
                return { name, node: param, initializer, type: param.type || null };
            }),
        };
    }
    getGenericArityOfClass(clazz) {
        if (!ts__default["default"].isClassDeclaration(clazz)) {
            return null;
        }
        return clazz.typeParameters !== undefined ? clazz.typeParameters.length : 0;
    }
    getVariableValue(declaration) {
        return declaration.initializer || null;
    }
    isStaticallyExported(decl) {
        // First check if there's an `export` modifier directly on the declaration.
        let topLevel = decl;
        if (ts__default["default"].isVariableDeclaration(decl) && ts__default["default"].isVariableDeclarationList(decl.parent)) {
            topLevel = decl.parent.parent;
        }
        const modifiers = ts__default["default"].canHaveModifiers(topLevel) ? ts__default["default"].getModifiers(topLevel) : undefined;
        if (modifiers !== undefined &&
            modifiers.some((modifier) => modifier.kind === ts__default["default"].SyntaxKind.ExportKeyword)) {
            // The node is part of a declaration that's directly exported.
            return true;
        }
        // If `topLevel` is not directly exported via a modifier, then it might be indirectly exported,
        // e.g.:
        //
        // class Foo {}
        // export {Foo};
        //
        // The only way to check this is to look at the module level for exports of the class. As a
        // performance optimization, this check is only performed if the class is actually declared at
        // the top level of the file and thus eligible for exporting in the first place.
        if (topLevel.parent === undefined || !ts__default["default"].isSourceFile(topLevel.parent)) {
            return false;
        }
        const localExports = this.getLocalExportedDeclarationsOfSourceFile(decl.getSourceFile());
        return localExports.has(decl);
    }
    getDirectImportOfIdentifier(id) {
        const symbol = this.checker.getSymbolAtLocation(id);
        if (symbol === undefined ||
            symbol.declarations === undefined ||
            symbol.declarations.length !== 1) {
            return null;
        }
        const decl = symbol.declarations[0];
        const importDecl = getContainingImportDeclaration(decl);
        // Ignore declarations that are defined locally (not imported).
        if (importDecl === null) {
            return null;
        }
        // The module specifier is guaranteed to be a string literal, so this should always pass.
        if (!ts__default["default"].isStringLiteral(importDecl.moduleSpecifier)) {
            // Not allowed to happen in TypeScript ASTs.
            return null;
        }
        return {
            from: importDecl.moduleSpecifier.text,
            name: getExportedName(decl, id),
            node: importDecl,
        };
    }
    /**
     * Try to get the import info for this identifier as though it is a namespaced import.
     *
     * For example, if the identifier is the `Directive` part of a qualified type chain like:
     *
     * ```
     * core.Directive
     * ```
     *
     * then it might be that `core` is a namespace import such as:
     *
     * ```
     * import * as core from 'tslib';
     * ```
     *
     * @param id the TypeScript identifier to find the import info for.
     * @returns The import info if this is a namespaced import or `null`.
     */
    getImportOfNamespacedIdentifier(id, namespaceIdentifier) {
        if (namespaceIdentifier === null) {
            return null;
        }
        const namespaceSymbol = this.checker.getSymbolAtLocation(namespaceIdentifier);
        if (!namespaceSymbol || namespaceSymbol.declarations === undefined) {
            return null;
        }
        const declaration = namespaceSymbol.declarations.length === 1 ? namespaceSymbol.declarations[0] : null;
        if (!declaration) {
            return null;
        }
        const namespaceDeclaration = ts__default["default"].isNamespaceImport(declaration) ? declaration : null;
        if (!namespaceDeclaration) {
            return null;
        }
        const importDeclaration = namespaceDeclaration.parent.parent;
        if (!ts__default["default"].isImportDeclaration(importDeclaration) ||
            !ts__default["default"].isStringLiteral(importDeclaration.moduleSpecifier)) {
            // Should not happen as this would be invalid TypesScript
            return null;
        }
        return {
            from: importDeclaration.moduleSpecifier.text,
            name: id.text,
            node: importDeclaration,
        };
    }
    /**
     * Resolve a `ts.Symbol` to its declaration, keeping track of the `viaModule` along the way.
     */
    getDeclarationOfSymbol(symbol, originalId) {
        // If the symbol points to a ShorthandPropertyAssignment, resolve it.
        let valueDeclaration = undefined;
        if (symbol.valueDeclaration !== undefined) {
            valueDeclaration = symbol.valueDeclaration;
        }
        else if (symbol.declarations !== undefined && symbol.declarations.length > 0) {
            valueDeclaration = symbol.declarations[0];
        }
        if (valueDeclaration !== undefined && ts__default["default"].isShorthandPropertyAssignment(valueDeclaration)) {
            const shorthandSymbol = this.checker.getShorthandAssignmentValueSymbol(valueDeclaration);
            if (shorthandSymbol === undefined) {
                return null;
            }
            return this.getDeclarationOfSymbol(shorthandSymbol, originalId);
        }
        else if (valueDeclaration !== undefined && ts__default["default"].isExportSpecifier(valueDeclaration)) {
            const targetSymbol = this.checker.getExportSpecifierLocalTargetSymbol(valueDeclaration);
            if (targetSymbol === undefined) {
                return null;
            }
            return this.getDeclarationOfSymbol(targetSymbol, originalId);
        }
        const importInfo = originalId && this.getImportOfIdentifier(originalId);
        // Now, resolve the Symbol to its declaration by following any and all aliases.
        while (symbol.flags & ts__default["default"].SymbolFlags.Alias) {
            symbol = this.checker.getAliasedSymbol(symbol);
        }
        // Look at the resolved Symbol's declarations and pick one of them to return. Value declarations
        // are given precedence over type declarations.
        if (symbol.valueDeclaration !== undefined) {
            return {
                node: symbol.valueDeclaration,
                viaModule: this._viaModule(symbol.valueDeclaration, originalId, importInfo),
            };
        }
        else if (symbol.declarations !== undefined && symbol.declarations.length > 0) {
            return {
                node: symbol.declarations[0],
                viaModule: this._viaModule(symbol.declarations[0], originalId, importInfo),
            };
        }
        else {
            return null;
        }
    }
    _reflectDecorator(node) {
        // Attempt to resolve the decorator expression into a reference to a concrete Identifier. The
        // expression may contain a call to a function which returns the decorator function, in which
        // case we want to return the arguments.
        let decoratorExpr = node.expression;
        let args = null;
        // Check for call expressions.
        if (ts__default["default"].isCallExpression(decoratorExpr)) {
            args = Array.from(decoratorExpr.arguments);
            decoratorExpr = decoratorExpr.expression;
        }
        // The final resolved decorator should be a `ts.Identifier` - if it's not, then something is
        // wrong and the decorator can't be resolved statically.
        if (!isDecoratorIdentifier(decoratorExpr)) {
            return null;
        }
        const decoratorIdentifier = ts__default["default"].isIdentifier(decoratorExpr) ? decoratorExpr : decoratorExpr.name;
        const importDecl = this.getImportOfIdentifier(decoratorIdentifier);
        return {
            name: decoratorIdentifier.text,
            identifier: decoratorExpr,
            import: importDecl,
            node,
            args,
        };
    }
    /**
     * Get the set of declarations declared in `file` which are exported.
     */
    getLocalExportedDeclarationsOfSourceFile(file) {
        const cacheSf = file;
        if (cacheSf[LocalExportedDeclarations] !== undefined) {
            // TS does not currently narrow symbol-keyed fields, hence the non-null assert is needed.
            return cacheSf[LocalExportedDeclarations];
        }
        const exportSet = new Set();
        cacheSf[LocalExportedDeclarations] = exportSet;
        const sfSymbol = this.checker.getSymbolAtLocation(cacheSf);
        if (sfSymbol === undefined || sfSymbol.exports === undefined) {
            return exportSet;
        }
        // Scan the exported symbol of the `ts.SourceFile` for the original `symbol` of the class
        // declaration.
        //
        // Note: when checking multiple classes declared in the same file, this repeats some operations.
        // In theory, this could be expensive if run in the context of a massive input file. If
        // performance does become an issue here, it should be possible to create a `Set<>`
        // Unfortunately, `ts.Iterator` doesn't implement the iterator protocol, so iteration here is
        // done manually.
        const iter = sfSymbol.exports.values();
        let item = iter.next();
        while (item.done !== true) {
            let exportedSymbol = item.value;
            // If this exported symbol comes from an `export {Foo}` statement, then the symbol is actually
            // for the export declaration, not the original declaration. Such a symbol will be an alias,
            // so unwrap aliasing if necessary.
            if (exportedSymbol.flags & ts__default["default"].SymbolFlags.Alias) {
                exportedSymbol = this.checker.getAliasedSymbol(exportedSymbol);
            }
            if (exportedSymbol.valueDeclaration !== undefined &&
                exportedSymbol.valueDeclaration.getSourceFile() === file) {
                exportSet.add(exportedSymbol.valueDeclaration);
            }
            item = iter.next();
        }
        return exportSet;
    }
    _viaModule(declaration, originalId, importInfo) {
        if (importInfo === null &&
            originalId !== null &&
            declaration.getSourceFile() !== originalId.getSourceFile()) {
            return AmbientImport;
        }
        return importInfo !== null && importInfo.from !== null && !importInfo.from.startsWith('.')
            ? importInfo.from
            : null;
    }
}
function reflectTypeEntityToDeclaration(type, checker) {
    let realSymbol = checker.getSymbolAtLocation(type);
    if (realSymbol === undefined) {
        throw new Error(`Cannot resolve type entity ${type.getText()} to symbol`);
    }
    while (realSymbol.flags & ts__default["default"].SymbolFlags.Alias) {
        realSymbol = checker.getAliasedSymbol(realSymbol);
    }
    let node = null;
    if (realSymbol.valueDeclaration !== undefined) {
        node = realSymbol.valueDeclaration;
    }
    else if (realSymbol.declarations !== undefined && realSymbol.declarations.length === 1) {
        node = realSymbol.declarations[0];
    }
    else {
        throw new Error(`Cannot resolve type entity symbol to declaration`);
    }
    if (ts__default["default"].isQualifiedName(type)) {
        if (!ts__default["default"].isIdentifier(type.left)) {
            throw new Error(`Cannot handle qualified name with non-identifier lhs`);
        }
        const symbol = checker.getSymbolAtLocation(type.left);
        if (symbol === undefined ||
            symbol.declarations === undefined ||
            symbol.declarations.length !== 1) {
            throw new Error(`Cannot resolve qualified type entity lhs to symbol`);
        }
        const decl = symbol.declarations[0];
        if (ts__default["default"].isNamespaceImport(decl)) {
            const clause = decl.parent;
            const importDecl = clause.parent;
            if (!ts__default["default"].isStringLiteral(importDecl.moduleSpecifier)) {
                throw new Error(`Module specifier is not a string`);
            }
            return { node, from: importDecl.moduleSpecifier.text };
        }
        else if (ts__default["default"].isModuleDeclaration(decl)) {
            return { node, from: null };
        }
        else {
            throw new Error(`Unknown import type?`);
        }
    }
    else {
        return { node, from: null };
    }
}
function extractModifiersOfMember(node) {
    const modifiers = ts__default["default"].getModifiers(node);
    let isStatic = false;
    let isReadonly = false;
    let accessLevel = ClassMemberAccessLevel.PublicWritable;
    if (modifiers !== undefined) {
        for (const modifier of modifiers) {
            switch (modifier.kind) {
                case ts__default["default"].SyntaxKind.StaticKeyword:
                    isStatic = true;
                    break;
                case ts__default["default"].SyntaxKind.PrivateKeyword:
                    accessLevel = ClassMemberAccessLevel.Private;
                    break;
                case ts__default["default"].SyntaxKind.ProtectedKeyword:
                    accessLevel = ClassMemberAccessLevel.Protected;
                    break;
                case ts__default["default"].SyntaxKind.ReadonlyKeyword:
                    isReadonly = true;
                    break;
            }
        }
    }
    if (isReadonly && accessLevel === ClassMemberAccessLevel.PublicWritable) {
        accessLevel = ClassMemberAccessLevel.PublicReadonly;
    }
    if (node.name !== undefined && ts__default["default"].isPrivateIdentifier(node.name)) {
        accessLevel = ClassMemberAccessLevel.EcmaScriptPrivate;
    }
    return { accessLevel, isStatic };
}
/**
 * Reflects a class element and returns static information about the
 * class member.
 *
 * Note: Decorator information is not included in this helper as it relies
 * on type checking to resolve originating import.
 */
function reflectClassMember(node) {
    let kind = null;
    let value = null;
    let name = null;
    let nameNode = null;
    if (ts__default["default"].isPropertyDeclaration(node)) {
        kind = ClassMemberKind.Property;
        value = node.initializer || null;
    }
    else if (ts__default["default"].isGetAccessorDeclaration(node)) {
        kind = ClassMemberKind.Getter;
    }
    else if (ts__default["default"].isSetAccessorDeclaration(node)) {
        kind = ClassMemberKind.Setter;
    }
    else if (ts__default["default"].isMethodDeclaration(node)) {
        kind = ClassMemberKind.Method;
    }
    else if (ts__default["default"].isConstructorDeclaration(node)) {
        kind = ClassMemberKind.Constructor;
    }
    else {
        return null;
    }
    if (ts__default["default"].isConstructorDeclaration(node)) {
        name = 'constructor';
    }
    else if (ts__default["default"].isIdentifier(node.name)) {
        name = node.name.text;
        nameNode = node.name;
    }
    else if (ts__default["default"].isStringLiteral(node.name)) {
        name = node.name.text;
        nameNode = node.name;
    }
    else if (ts__default["default"].isPrivateIdentifier(node.name)) {
        name = node.name.text;
        nameNode = node.name;
    }
    else {
        return null;
    }
    const { accessLevel, isStatic } = extractModifiersOfMember(node);
    return {
        node,
        implementation: node,
        kind,
        type: node.type || null,
        accessLevel,
        name,
        nameNode,
        value,
        isStatic,
    };
}
function castDeclarationToClassOrDie(declaration) {
    if (!ts__default["default"].isClassDeclaration(declaration)) {
        throw new Error(`Reflecting on a ${ts__default["default"].SyntaxKind[declaration.kind]} instead of a ClassDeclaration.`);
    }
    return declaration;
}
function parameterName(name) {
    if (ts__default["default"].isIdentifier(name)) {
        return name.text;
    }
    else {
        return null;
    }
}
/**
 * Compute the left most identifier in a qualified type chain. E.g. the `a` of `a.b.c.SomeType`.
 * @param qualifiedName The starting property access expression from which we want to compute
 * the left most identifier.
 * @returns the left most identifier in the chain or `null` if it is not an identifier.
 */
function getQualifiedNameRoot(qualifiedName) {
    while (ts__default["default"].isQualifiedName(qualifiedName.left)) {
        qualifiedName = qualifiedName.left;
    }
    return ts__default["default"].isIdentifier(qualifiedName.left) ? qualifiedName.left : null;
}
/**
 * Compute the left most identifier in a property access chain. E.g. the `a` of `a.b.c.d`.
 * @param propertyAccess The starting property access expression from which we want to compute
 * the left most identifier.
 * @returns the left most identifier in the chain or `null` if it is not an identifier.
 */
function getFarLeftIdentifier(propertyAccess) {
    while (ts__default["default"].isPropertyAccessExpression(propertyAccess.expression)) {
        propertyAccess = propertyAccess.expression;
    }
    return ts__default["default"].isIdentifier(propertyAccess.expression) ? propertyAccess.expression : null;
}
/**
 * Gets the closest ancestor `ImportDeclaration` to a node.
 */
function getContainingImportDeclaration(node) {
    let parent = node.parent;
    while (parent && !ts__default["default"].isSourceFile(parent)) {
        if (ts__default["default"].isImportDeclaration(parent)) {
            return parent;
        }
        parent = parent.parent;
    }
    return null;
}
/**
 * Compute the name by which the `decl` was exported, not imported.
 * If no such declaration can be found (e.g. it is a namespace import)
 * then fallback to the `originalId`.
 */
function getExportedName(decl, originalId) {
    return ts__default["default"].isImportSpecifier(decl)
        ? (decl.propertyName !== undefined ? decl.propertyName : decl.name).text
        : originalId.text;
}
const LocalExportedDeclarations = Symbol('LocalExportedDeclarations');

/**
 * A `ts.Node` plus the context in which it was discovered.
 *
 * A `Reference` is a pointer to a `ts.Node` that was extracted from the program somehow. It
 * contains not only the node itself, but the information regarding how the node was located. In
 * particular, it might track different identifiers by which the node is exposed, as well as
 * potentially a module specifier which might expose the node.
 *
 * The Angular compiler uses `Reference`s instead of `ts.Node`s when tracking classes or generating
 * imports.
 */
class Reference {
    constructor(node, bestGuessOwningModule = null) {
        this.node = node;
        this.identifiers = [];
        /**
         * Indicates that the Reference was created synthetically, not as a result of natural value
         * resolution.
         *
         * This is used to avoid misinterpreting the Reference in certain contexts.
         */
        this.synthetic = false;
        this._alias = null;
        if (bestGuessOwningModule === AmbientImport) {
            this.isAmbient = true;
            this.bestGuessOwningModule = null;
        }
        else {
            this.isAmbient = false;
            this.bestGuessOwningModule = bestGuessOwningModule;
        }
        const id = identifierOfNode(node);
        if (id !== null) {
            this.identifiers.push(id);
        }
    }
    /**
     * The best guess at which module specifier owns this particular reference, or `null` if there
     * isn't one.
     */
    get ownedByModuleGuess() {
        if (this.bestGuessOwningModule !== null) {
            return this.bestGuessOwningModule.specifier;
        }
        else {
            return null;
        }
    }
    /**
     * Whether this reference has a potential owning module or not.
     *
     * See `bestGuessOwningModule`.
     */
    get hasOwningModuleGuess() {
        return this.bestGuessOwningModule !== null;
    }
    /**
     * A name for the node, if one is available.
     *
     * This is only suited for debugging. Any actual references to this node should be made with
     * `ts.Identifier`s (see `getIdentityIn`).
     */
    get debugName() {
        const id = identifierOfNode(this.node);
        return id !== null ? id.text : null;
    }
    get alias() {
        return this._alias;
    }
    /**
     * Record a `ts.Identifier` by which it's valid to refer to this node, within the context of this
     * `Reference`.
     */
    addIdentifier(identifier) {
        this.identifiers.push(identifier);
    }
    /**
     * Get a `ts.Identifier` within this `Reference` that can be used to refer within the context of a
     * given `ts.SourceFile`, if any.
     */
    getIdentityIn(context) {
        return this.identifiers.find((id) => id.getSourceFile() === context) || null;
    }
    /**
     * Get a `ts.Identifier` for this `Reference` that exists within the given expression.
     *
     * This is very useful for producing `ts.Diagnostic`s that reference `Reference`s that were
     * extracted from some larger expression, as it can be used to pinpoint the `ts.Identifier` within
     * the expression from which the `Reference` originated.
     */
    getIdentityInExpression(expr) {
        const sf = expr.getSourceFile();
        return (this.identifiers.find((id) => {
            if (id.getSourceFile() !== sf) {
                return false;
            }
            // This identifier is a match if its position lies within the given expression.
            return id.pos >= expr.pos && id.end <= expr.end;
        }) || null);
    }
    /**
     * Given the 'container' expression from which this `Reference` was extracted, produce a
     * `ts.Expression` to use in a diagnostic which best indicates the position within the container
     * expression that generated the `Reference`.
     *
     * For example, given a `Reference` to the class 'Bar' and the containing expression:
     * `[Foo, Bar, Baz]`, this function would attempt to return the `ts.Identifier` for `Bar` within
     * the array. This could be used to produce a nice diagnostic context:
     *
     * ```text
     * [Foo, Bar, Baz]
     *       ~~~
     * ```
     *
     * If no specific node can be found, then the `fallback` expression is used, which defaults to the
     * entire containing expression.
     */
    getOriginForDiagnostics(container, fallback = container) {
        const id = this.getIdentityInExpression(container);
        return id !== null ? id : fallback;
    }
    cloneWithAlias(alias) {
        const ref = new Reference(this.node, this.isAmbient ? AmbientImport : this.bestGuessOwningModule);
        ref.identifiers = [...this.identifiers];
        ref._alias = alias;
        return ref;
    }
    cloneWithNoIdentifiers() {
        const ref = new Reference(this.node, this.isAmbient ? AmbientImport : this.bestGuessOwningModule);
        ref._alias = this._alias;
        ref.identifiers = [];
        return ref;
    }
}

/**
 * A mapping of component property and template binding property names, for example containing the
 * inputs of a particular directive or component.
 *
 * A single component property has exactly one input/output annotation (and therefore one binding
 * property name) associated with it, but the same binding property name may be shared across many
 * component property names.
 *
 * Allows bidirectional querying of the mapping - looking up all inputs/outputs with a given
 * property name, or mapping from a specific class property to its binding property name.
 */
class ClassPropertyMapping {
    constructor(forwardMap) {
        this.forwardMap = forwardMap;
        this.reverseMap = reverseMapFromForwardMap(forwardMap);
    }
    /**
     * Construct a `ClassPropertyMapping` with no entries.
     */
    static empty() {
        return new ClassPropertyMapping(new Map());
    }
    /**
     * Construct a `ClassPropertyMapping` from a primitive JS object which maps class property names
     * to either binding property names or an array that contains both names, which is used in on-disk
     * metadata formats (e.g. in .d.ts files).
     */
    static fromMappedObject(obj) {
        const forwardMap = new Map();
        for (const classPropertyName of Object.keys(obj)) {
            const value = obj[classPropertyName];
            let inputOrOutput;
            if (typeof value === 'string') {
                inputOrOutput = {
                    classPropertyName,
                    bindingPropertyName: value,
                    // Inputs/outputs not captured via an explicit `InputOrOutput` mapping
                    // value are always considered non-signal. This is the string shorthand.
                    isSignal: false,
                };
            }
            else {
                inputOrOutput = value;
            }
            forwardMap.set(classPropertyName, inputOrOutput);
        }
        return new ClassPropertyMapping(forwardMap);
    }
    /**
     * Merge two mappings into one, with class properties from `b` taking precedence over class
     * properties from `a`.
     */
    static merge(a, b) {
        const forwardMap = new Map(a.forwardMap.entries());
        for (const [classPropertyName, inputOrOutput] of b.forwardMap) {
            forwardMap.set(classPropertyName, inputOrOutput);
        }
        return new ClassPropertyMapping(forwardMap);
    }
    /**
     * All class property names mapped in this mapping.
     */
    get classPropertyNames() {
        return Array.from(this.forwardMap.keys());
    }
    /**
     * All binding property names mapped in this mapping.
     */
    get propertyNames() {
        return Array.from(this.reverseMap.keys());
    }
    /**
     * Check whether a mapping for the given property name exists.
     */
    hasBindingPropertyName(propertyName) {
        return this.reverseMap.has(propertyName);
    }
    /**
     * Lookup all `InputOrOutput`s that use this `propertyName`.
     */
    getByBindingPropertyName(propertyName) {
        return this.reverseMap.has(propertyName) ? this.reverseMap.get(propertyName) : null;
    }
    /**
     * Lookup the `InputOrOutput` associated with a `classPropertyName`.
     */
    getByClassPropertyName(classPropertyName) {
        return this.forwardMap.has(classPropertyName) ? this.forwardMap.get(classPropertyName) : null;
    }
    /**
     * Convert this mapping to a primitive JS object which maps each class property directly to the
     * binding property name associated with it.
     */
    toDirectMappedObject() {
        const obj = {};
        for (const [classPropertyName, inputOrOutput] of this.forwardMap) {
            obj[classPropertyName] = inputOrOutput.bindingPropertyName;
        }
        return obj;
    }
    /**
     * Convert this mapping to a primitive JS object which maps each class property either to itself
     * (for cases where the binding property name is the same) or to an array which contains both
     * names if they differ.
     *
     * This object format is used when mappings are serialized (for example into .d.ts files).
     * @param transform Function used to transform the values of the generated map.
     */
    toJointMappedObject(transform) {
        const obj = {};
        for (const [classPropertyName, inputOrOutput] of this.forwardMap) {
            obj[classPropertyName] = transform(inputOrOutput);
        }
        return obj;
    }
    /**
     * Implement the iterator protocol and return entry objects which contain the class and binding
     * property names (and are useful for destructuring).
     */
    *[Symbol.iterator]() {
        for (const inputOrOutput of this.forwardMap.values()) {
            yield inputOrOutput;
        }
    }
}
function reverseMapFromForwardMap(forwardMap) {
    const reverseMap = new Map();
    for (const [_, inputOrOutput] of forwardMap) {
        if (!reverseMap.has(inputOrOutput.bindingPropertyName)) {
            reverseMap.set(inputOrOutput.bindingPropertyName, []);
        }
        reverseMap.get(inputOrOutput.bindingPropertyName).push(inputOrOutput);
    }
    return reverseMap;
}

function extractReferencesFromType(checker, def, bestGuessOwningModule) {
    if (!ts__default["default"].isTupleTypeNode(def)) {
        return [];
    }
    return def.elements.map((element) => {
        if (!ts__default["default"].isTypeQueryNode(element)) {
            throw new Error(`Expected TypeQueryNode: ${nodeDebugInfo(element)}`);
        }
        return extraReferenceFromTypeQuery(checker, element, def, bestGuessOwningModule);
    });
}
function extraReferenceFromTypeQuery(checker, typeNode, origin, bestGuessOwningModule) {
    const type = typeNode.exprName;
    const { node, from } = reflectTypeEntityToDeclaration(type, checker);
    if (!isNamedClassDeclaration(node)) {
        throw new Error(`Expected named ClassDeclaration: ${nodeDebugInfo(node)}`);
    }
    if (from !== null && !from.startsWith('.')) {
        // The symbol was imported using an absolute module specifier so return a reference that
        // uses that absolute module specifier as its best guess owning module.
        return new Reference(node, {
            specifier: from,
            resolutionContext: origin.getSourceFile().fileName,
        });
    }
    // For local symbols or symbols that were imported using a relative module import it is
    // assumed that the symbol is exported from the provided best guess owning module.
    return new Reference(node, bestGuessOwningModule);
}
function readBooleanType(type) {
    if (!ts__default["default"].isLiteralTypeNode(type)) {
        return null;
    }
    switch (type.literal.kind) {
        case ts__default["default"].SyntaxKind.TrueKeyword:
            return true;
        case ts__default["default"].SyntaxKind.FalseKeyword:
            return false;
        default:
            return null;
    }
}
function readStringType(type) {
    if (!ts__default["default"].isLiteralTypeNode(type) || !ts__default["default"].isStringLiteral(type.literal)) {
        return null;
    }
    return type.literal.text;
}
function readMapType(type, valueTransform) {
    if (!ts__default["default"].isTypeLiteralNode(type)) {
        return {};
    }
    const obj = {};
    type.members.forEach((member) => {
        if (!ts__default["default"].isPropertySignature(member) ||
            member.type === undefined ||
            member.name === undefined ||
            (!ts__default["default"].isStringLiteral(member.name) && !ts__default["default"].isIdentifier(member.name))) {
            return;
        }
        const value = valueTransform(member.type);
        if (value !== null) {
            obj[member.name.text] = value;
        }
    });
    return obj;
}
function readStringArrayType(type) {
    if (!ts__default["default"].isTupleTypeNode(type)) {
        return [];
    }
    const res = [];
    type.elements.forEach((el) => {
        if (!ts__default["default"].isLiteralTypeNode(el) || !ts__default["default"].isStringLiteral(el.literal)) {
            return;
        }
        res.push(el.literal.text);
    });
    return res;
}
/**
 * Inspects the class' members and extracts the metadata that is used when type-checking templates
 * that use the directive. This metadata does not contain information from a base class, if any,
 * making this metadata invariant to changes of inherited classes.
 */
function extractDirectiveTypeCheckMeta(node, inputs, reflector) {
    const members = reflector.getMembersOfClass(node);
    const staticMembers = members.filter((member) => member.isStatic);
    const ngTemplateGuards = staticMembers
        .map(extractTemplateGuard)
        .filter((guard) => guard !== null);
    const hasNgTemplateContextGuard = staticMembers.some((member) => member.kind === ClassMemberKind.Method && member.name === 'ngTemplateContextGuard');
    const coercedInputFields = new Set(staticMembers.map(extractCoercedInput).filter((inputName) => {
        // If the input refers to a signal input, we will not respect coercion members.
        // A transform function should be used instead.
        if (inputName === null || inputs.getByClassPropertyName(inputName)?.isSignal) {
            return false;
        }
        return true;
    }));
    const restrictedInputFields = new Set();
    const stringLiteralInputFields = new Set();
    const undeclaredInputFields = new Set();
    for (const { classPropertyName, transform } of inputs) {
        const field = members.find((member) => member.name === classPropertyName);
        if (field === undefined || field.node === null) {
            undeclaredInputFields.add(classPropertyName);
            continue;
        }
        if (isRestricted(field.node)) {
            restrictedInputFields.add(classPropertyName);
        }
        if (field.nameNode !== null && ts__default["default"].isStringLiteral(field.nameNode)) {
            stringLiteralInputFields.add(classPropertyName);
        }
        if (transform !== null) {
            coercedInputFields.add(classPropertyName);
        }
    }
    const arity = reflector.getGenericArityOfClass(node);
    return {
        hasNgTemplateContextGuard,
        ngTemplateGuards,
        coercedInputFields,
        restrictedInputFields,
        stringLiteralInputFields,
        undeclaredInputFields,
        isGeneric: arity !== null && arity > 0,
    };
}
function isRestricted(node) {
    const modifiers = ts__default["default"].canHaveModifiers(node) ? ts__default["default"].getModifiers(node) : undefined;
    return (modifiers !== undefined &&
        modifiers.some(({ kind }) => {
            return (kind === ts__default["default"].SyntaxKind.PrivateKeyword ||
                kind === ts__default["default"].SyntaxKind.ProtectedKeyword ||
                kind === ts__default["default"].SyntaxKind.ReadonlyKeyword);
        }));
}
function extractTemplateGuard(member) {
    if (!member.name.startsWith('ngTemplateGuard_')) {
        return null;
    }
    const inputName = afterUnderscore(member.name);
    if (member.kind === ClassMemberKind.Property) {
        let type = null;
        if (member.type !== null &&
            ts__default["default"].isLiteralTypeNode(member.type) &&
            ts__default["default"].isStringLiteral(member.type.literal)) {
            type = member.type.literal.text;
        }
        // Only property members with string literal type 'binding' are considered as template guard.
        if (type !== 'binding') {
            return null;
        }
        return { inputName, type };
    }
    else if (member.kind === ClassMemberKind.Method) {
        return { inputName, type: 'invocation' };
    }
    else {
        return null;
    }
}
function extractCoercedInput(member) {
    if (member.kind !== ClassMemberKind.Property || !member.name.startsWith('ngAcceptInputType_')) {
        return null;
    }
    return afterUnderscore(member.name);
}
function afterUnderscore(str) {
    const pos = str.indexOf('_');
    if (pos === -1) {
        throw new Error(`Expected '${str}' to contain '_'`);
    }
    return str.slice(pos + 1);
}

/**
 * A `MetadataReader` that can read metadata from `.d.ts` files, which have static Ivy properties
 * from an upstream compilation already.
 */
class DtsMetadataReader {
    constructor(checker, reflector) {
        this.checker = checker;
        this.reflector = reflector;
    }
    /**
     * Read the metadata from a class that has already been compiled somehow (either it's in a .d.ts
     * file, or in a .ts file with a handwritten definition).
     *
     * @param ref `Reference` to the class of interest, with the context of how it was obtained.
     */
    getNgModuleMetadata(ref) {
        const clazz = ref.node;
        // This operation is explicitly not memoized, as it depends on `ref.ownedByModuleGuess`.
        // TODO(alxhub): investigate caching of .d.ts module metadata.
        const ngModuleDef = this.reflector
            .getMembersOfClass(clazz)
            .find((member) => member.name === 'ɵmod' && member.isStatic);
        if (ngModuleDef === undefined) {
            return null;
        }
        else if (
        // Validate that the shape of the ngModuleDef type is correct.
        ngModuleDef.type === null ||
            !ts__default["default"].isTypeReferenceNode(ngModuleDef.type) ||
            ngModuleDef.type.typeArguments === undefined ||
            ngModuleDef.type.typeArguments.length !== 4) {
            return null;
        }
        // Read the ModuleData out of the type arguments.
        const [_, declarationMetadata, importMetadata, exportMetadata] = ngModuleDef.type.typeArguments;
        return {
            kind: MetaKind.NgModule,
            ref,
            declarations: extractReferencesFromType(this.checker, declarationMetadata, ref.bestGuessOwningModule),
            exports: extractReferencesFromType(this.checker, exportMetadata, ref.bestGuessOwningModule),
            imports: extractReferencesFromType(this.checker, importMetadata, ref.bestGuessOwningModule),
            schemas: [],
            rawDeclarations: null,
            rawImports: null,
            rawExports: null,
            decorator: null,
            // NgModules declared outside the current compilation are assumed to contain providers, as it
            // would be a non-breaking change for a library to introduce providers at any point.
            mayDeclareProviders: true,
        };
    }
    /**
     * Read directive (or component) metadata from a referenced class in a .d.ts file.
     */
    getDirectiveMetadata(ref) {
        const clazz = ref.node;
        const def = this.reflector
            .getMembersOfClass(clazz)
            .find((field) => field.isStatic && (field.name === 'ɵcmp' || field.name === 'ɵdir'));
        if (def === undefined) {
            // No definition could be found.
            return null;
        }
        else if (def.type === null ||
            !ts__default["default"].isTypeReferenceNode(def.type) ||
            def.type.typeArguments === undefined ||
            def.type.typeArguments.length < 2) {
            // The type metadata was the wrong shape.
            return null;
        }
        const isComponent = def.name === 'ɵcmp';
        const ctorParams = this.reflector.getConstructorParameters(clazz);
        // A directive is considered to be structural if:
        // 1) it's a directive, not a component, and
        // 2) it injects `TemplateRef`
        const isStructural = !isComponent &&
            ctorParams !== null &&
            ctorParams.some((param) => {
                return (param.typeValueReference.kind === 1 /* TypeValueReferenceKind.IMPORTED */ &&
                    param.typeValueReference.moduleName === '@angular/core' &&
                    param.typeValueReference.importedName === 'TemplateRef');
            });
        const ngContentSelectors = def.type.typeArguments.length > 6 ? readStringArrayType(def.type.typeArguments[6]) : null;
        // Note: the default value is still `false` here, because only legacy .d.ts files written before
        // we had so many arguments use this default.
        const isStandalone = def.type.typeArguments.length > 7 && (readBooleanType(def.type.typeArguments[7]) ?? false);
        const inputs = ClassPropertyMapping.fromMappedObject(readInputsType(def.type.typeArguments[3]));
        const outputs = ClassPropertyMapping.fromMappedObject(readMapType(def.type.typeArguments[4], readStringType));
        const hostDirectives = def.type.typeArguments.length > 8
            ? readHostDirectivesType(this.checker, def.type.typeArguments[8], ref.bestGuessOwningModule)
            : null;
        const isSignal = def.type.typeArguments.length > 9 && (readBooleanType(def.type.typeArguments[9]) ?? false);
        return {
            kind: MetaKind.Directive,
            matchSource: MatchSource.Selector,
            ref,
            name: clazz.name.text,
            isComponent,
            selector: readStringType(def.type.typeArguments[1]),
            exportAs: readStringArrayType(def.type.typeArguments[2]),
            inputs,
            outputs,
            hostDirectives,
            queries: readStringArrayType(def.type.typeArguments[5]),
            ...extractDirectiveTypeCheckMeta(clazz, inputs, this.reflector),
            baseClass: readBaseClass(clazz, this.checker, this.reflector),
            isPoisoned: false,
            isStructural,
            animationTriggerNames: null,
            ngContentSelectors,
            isStandalone,
            isSignal,
            // We do not transfer information about inputs from class metadata
            // via `.d.ts` declarations. This is fine because this metadata is
            // currently only used for classes defined in source files. E.g. in migrations.
            inputFieldNamesFromMetadataArray: null,
            // Imports are tracked in metadata only for template type-checking purposes,
            // so standalone components from .d.ts files don't have any.
            imports: null,
            rawImports: null,
            deferredImports: null,
            // The same goes for schemas.
            schemas: null,
            decorator: null,
            // Assume that standalone components from .d.ts files may export providers.
            assumedToExportProviders: isComponent && isStandalone,
            // `preserveWhitespaces` isn't encoded in the .d.ts and is only
            // used to increase the accuracy of a diagnostic.
            preserveWhitespaces: false,
            isExplicitlyDeferred: false,
        };
    }
    /**
     * Read pipe metadata from a referenced class in a .d.ts file.
     */
    getPipeMetadata(ref) {
        const def = this.reflector
            .getMembersOfClass(ref.node)
            .find((field) => field.isStatic && field.name === 'ɵpipe');
        if (def === undefined) {
            // No definition could be found.
            return null;
        }
        else if (def.type === null ||
            !ts__default["default"].isTypeReferenceNode(def.type) ||
            def.type.typeArguments === undefined ||
            def.type.typeArguments.length < 2) {
            // The type metadata was the wrong shape.
            return null;
        }
        const type = def.type.typeArguments[1];
        if (!ts__default["default"].isLiteralTypeNode(type) || !ts__default["default"].isStringLiteral(type.literal)) {
            // The type metadata was the wrong type.
            return null;
        }
        const name = type.literal.text;
        const isStandalone = def.type.typeArguments.length > 2 && (readBooleanType(def.type.typeArguments[2]) ?? false);
        return {
            kind: MetaKind.Pipe,
            ref,
            name,
            nameExpr: null,
            isStandalone,
            decorator: null,
            isExplicitlyDeferred: false,
        };
    }
}
function readInputsType(type) {
    const inputsMap = {};
    if (ts__default["default"].isTypeLiteralNode(type)) {
        for (const member of type.members) {
            if (!ts__default["default"].isPropertySignature(member) ||
                member.type === undefined ||
                member.name === undefined ||
                (!ts__default["default"].isStringLiteral(member.name) && !ts__default["default"].isIdentifier(member.name))) {
                continue;
            }
            const stringValue = readStringType(member.type);
            const classPropertyName = member.name.text;
            // Before v16 the inputs map has the type of `{[field: string]: string}`.
            // After v16 it has the type of `{[field: string]: {alias: string, required: boolean}}`.
            if (stringValue != null) {
                inputsMap[classPropertyName] = {
                    bindingPropertyName: stringValue,
                    classPropertyName,
                    required: false,
                    // Signal inputs were not supported pre v16- so those inputs are never signal based.
                    isSignal: false,
                    // Input transform are only tracked for locally-compiled directives. Directives coming
                    // from the .d.ts already have them included through `ngAcceptInputType` class members,
                    // or via the `InputSignal` type of the member.
                    transform: null,
                };
            }
            else {
                const config = readMapType(member.type, (innerValue) => {
                    return readStringType(innerValue) ?? readBooleanType(innerValue);
                });
                inputsMap[classPropertyName] = {
                    classPropertyName,
                    bindingPropertyName: config.alias,
                    required: config.required,
                    isSignal: !!config.isSignal,
                    // Input transform are only tracked for locally-compiled directives. Directives coming
                    // from the .d.ts already have them included through `ngAcceptInputType` class members,
                    // or via the `InputSignal` type of the member.
                    transform: null,
                };
            }
        }
    }
    return inputsMap;
}
function readBaseClass(clazz, checker, reflector) {
    if (!isNamedClassDeclaration(clazz)) {
        // Technically this is an error in a .d.ts file, but for the purposes of finding the base class
        // it's ignored.
        return reflector.hasBaseClass(clazz) ? 'dynamic' : null;
    }
    if (clazz.heritageClauses !== undefined) {
        for (const clause of clazz.heritageClauses) {
            if (clause.token === ts__default["default"].SyntaxKind.ExtendsKeyword) {
                const baseExpr = clause.types[0].expression;
                let symbol = checker.getSymbolAtLocation(baseExpr);
                if (symbol === undefined) {
                    return 'dynamic';
                }
                else if (symbol.flags & ts__default["default"].SymbolFlags.Alias) {
                    symbol = checker.getAliasedSymbol(symbol);
                }
                if (symbol.valueDeclaration !== undefined &&
                    isNamedClassDeclaration(symbol.valueDeclaration)) {
                    return new Reference(symbol.valueDeclaration);
                }
                else {
                    return 'dynamic';
                }
            }
        }
    }
    return null;
}
function readHostDirectivesType(checker, type, bestGuessOwningModule) {
    if (!ts__default["default"].isTupleTypeNode(type) || type.elements.length === 0) {
        return null;
    }
    const result = [];
    for (const hostDirectiveType of type.elements) {
        const { directive, inputs, outputs } = readMapType(hostDirectiveType, (type) => type);
        if (directive) {
            if (!ts__default["default"].isTypeQueryNode(directive)) {
                throw new Error(`Expected TypeQueryNode: ${nodeDebugInfo(directive)}`);
            }
            result.push({
                directive: extraReferenceFromTypeQuery(checker, directive, type, bestGuessOwningModule),
                isForwardReference: false,
                inputs: readMapType(inputs, readStringType),
                outputs: readMapType(outputs, readStringType),
            });
        }
    }
    return result.length > 0 ? result : null;
}

/** Module name of the framework core. */
const CORE_MODULE = '@angular/core';
function isAngularCore(decorator) {
    return decorator.import !== null && decorator.import.from === CORE_MODULE;
}
function getAngularDecorators(decorators, names, isCore) {
    return decorators.filter((decorator) => {
        const name = isCore ? decorator.name : decorator.import?.name;
        if (name === undefined || !names.includes(name)) {
            return false;
        }
        return isCore || isAngularCore(decorator);
    });
}

function literalBinaryOp(op) {
    return { op, literal: true };
}
function referenceBinaryOp(op) {
    return { op, literal: false };
}
new Map([
    [ts__default["default"].SyntaxKind.PlusToken, literalBinaryOp((a, b) => a + b)],
    [ts__default["default"].SyntaxKind.MinusToken, literalBinaryOp((a, b) => a - b)],
    [ts__default["default"].SyntaxKind.AsteriskToken, literalBinaryOp((a, b) => a * b)],
    [ts__default["default"].SyntaxKind.SlashToken, literalBinaryOp((a, b) => a / b)],
    [ts__default["default"].SyntaxKind.PercentToken, literalBinaryOp((a, b) => a % b)],
    [ts__default["default"].SyntaxKind.AmpersandToken, literalBinaryOp((a, b) => a & b)],
    [ts__default["default"].SyntaxKind.BarToken, literalBinaryOp((a, b) => a | b)],
    [ts__default["default"].SyntaxKind.CaretToken, literalBinaryOp((a, b) => a ^ b)],
    [ts__default["default"].SyntaxKind.LessThanToken, literalBinaryOp((a, b) => a < b)],
    [ts__default["default"].SyntaxKind.LessThanEqualsToken, literalBinaryOp((a, b) => a <= b)],
    [ts__default["default"].SyntaxKind.GreaterThanToken, literalBinaryOp((a, b) => a > b)],
    [ts__default["default"].SyntaxKind.GreaterThanEqualsToken, literalBinaryOp((a, b) => a >= b)],
    [ts__default["default"].SyntaxKind.EqualsEqualsToken, literalBinaryOp((a, b) => a == b)],
    [ts__default["default"].SyntaxKind.EqualsEqualsEqualsToken, literalBinaryOp((a, b) => a === b)],
    [ts__default["default"].SyntaxKind.ExclamationEqualsToken, literalBinaryOp((a, b) => a != b)],
    [ts__default["default"].SyntaxKind.ExclamationEqualsEqualsToken, literalBinaryOp((a, b) => a !== b)],
    [ts__default["default"].SyntaxKind.LessThanLessThanToken, literalBinaryOp((a, b) => a << b)],
    [ts__default["default"].SyntaxKind.GreaterThanGreaterThanToken, literalBinaryOp((a, b) => a >> b)],
    [ts__default["default"].SyntaxKind.GreaterThanGreaterThanGreaterThanToken, literalBinaryOp((a, b) => a >>> b)],
    [ts__default["default"].SyntaxKind.AsteriskAsteriskToken, literalBinaryOp((a, b) => Math.pow(a, b))],
    [ts__default["default"].SyntaxKind.AmpersandAmpersandToken, referenceBinaryOp((a, b) => a && b)],
    [ts__default["default"].SyntaxKind.BarBarToken, referenceBinaryOp((a, b) => a || b)],
]);
new Map([
    [ts__default["default"].SyntaxKind.TildeToken, (a) => ~a],
    [ts__default["default"].SyntaxKind.MinusToken, (a) => -a],
    [ts__default["default"].SyntaxKind.PlusToken, (a) => +a],
    [ts__default["default"].SyntaxKind.ExclamationToken, (a) => !a],
]);

/**
 * Specifies the compilation mode that is used for the compilation.
 */
var CompilationMode;
(function (CompilationMode) {
    /**
     * Generates fully AOT compiled code using Ivy instructions.
     */
    CompilationMode[CompilationMode["FULL"] = 0] = "FULL";
    /**
     * Generates code using a stable, but intermediate format suitable to be published to NPM.
     */
    CompilationMode[CompilationMode["PARTIAL"] = 1] = "PARTIAL";
    /**
     * Generates code based on each individual source file without using its
     * dependencies (suitable for local dev edit/refresh workflow).
     */
    CompilationMode[CompilationMode["LOCAL"] = 2] = "LOCAL";
})(CompilationMode || (CompilationMode = {}));
var HandlerPrecedence;
(function (HandlerPrecedence) {
    /**
     * Handler with PRIMARY precedence cannot overlap - there can only be one on a given class.
     *
     * If more than one PRIMARY handler matches a class, an error is produced.
     */
    HandlerPrecedence[HandlerPrecedence["PRIMARY"] = 0] = "PRIMARY";
    /**
     * Handlers with SHARED precedence can match any class, possibly in addition to a single PRIMARY
     * handler.
     *
     * It is not an error for a class to have any number of SHARED handlers.
     */
    HandlerPrecedence[HandlerPrecedence["SHARED"] = 1] = "SHARED";
    /**
     * Handlers with WEAK precedence that match a class are ignored if any handlers with stronger
     * precedence match a class.
     */
    HandlerPrecedence[HandlerPrecedence["WEAK"] = 2] = "WEAK";
})(HandlerPrecedence || (HandlerPrecedence = {}));

/**
 * A phase of compilation for which time is tracked in a distinct bucket.
 */
var PerfPhase;
(function (PerfPhase) {
    /**
     * The "default" phase which tracks time not spent in any other phase.
     */
    PerfPhase[PerfPhase["Unaccounted"] = 0] = "Unaccounted";
    /**
     * Time spent setting up the compiler, before a TypeScript program is created.
     *
     * This includes operations like configuring the `ts.CompilerHost` and any wrappers.
     */
    PerfPhase[PerfPhase["Setup"] = 1] = "Setup";
    /**
     * Time spent in `ts.createProgram`, including reading and parsing `ts.SourceFile`s in the
     * `ts.CompilerHost`.
     *
     * This might be an incremental program creation operation.
     */
    PerfPhase[PerfPhase["TypeScriptProgramCreate"] = 2] = "TypeScriptProgramCreate";
    /**
     * Time spent reconciling the contents of an old `ts.Program` with the new incremental one.
     *
     * Only present in incremental compilations.
     */
    PerfPhase[PerfPhase["Reconciliation"] = 3] = "Reconciliation";
    /**
     * Time spent updating an `NgCompiler` instance with a resource-only change.
     *
     * Only present in incremental compilations where the change was resource-only.
     */
    PerfPhase[PerfPhase["ResourceUpdate"] = 4] = "ResourceUpdate";
    /**
     * Time spent calculating the plain TypeScript diagnostics (structural and semantic).
     */
    PerfPhase[PerfPhase["TypeScriptDiagnostics"] = 5] = "TypeScriptDiagnostics";
    /**
     * Time spent in Angular analysis of individual classes in the program.
     */
    PerfPhase[PerfPhase["Analysis"] = 6] = "Analysis";
    /**
     * Time spent in Angular global analysis (synthesis of analysis information into a complete
     * understanding of the program).
     */
    PerfPhase[PerfPhase["Resolve"] = 7] = "Resolve";
    /**
     * Time spent building the import graph of the program in order to perform cycle detection.
     */
    PerfPhase[PerfPhase["CycleDetection"] = 8] = "CycleDetection";
    /**
     * Time spent generating the text of Type Check Blocks in order to perform template type checking.
     */
    PerfPhase[PerfPhase["TcbGeneration"] = 9] = "TcbGeneration";
    /**
     * Time spent updating the `ts.Program` with new Type Check Block code.
     */
    PerfPhase[PerfPhase["TcbUpdateProgram"] = 10] = "TcbUpdateProgram";
    /**
     * Time spent by TypeScript performing its emit operations, including downleveling and writing
     * output files.
     */
    PerfPhase[PerfPhase["TypeScriptEmit"] = 11] = "TypeScriptEmit";
    /**
     * Time spent by Angular performing code transformations of ASTs as they're about to be emitted.
     *
     * This includes the actual code generation step for templates, and occurs during the emit phase
     * (but is tracked separately from `TypeScriptEmit` time).
     */
    PerfPhase[PerfPhase["Compile"] = 12] = "Compile";
    /**
     * Time spent performing a `TemplateTypeChecker` autocompletion operation.
     */
    PerfPhase[PerfPhase["TtcAutocompletion"] = 13] = "TtcAutocompletion";
    /**
     * Time spent computing template type-checking diagnostics.
     */
    PerfPhase[PerfPhase["TtcDiagnostics"] = 14] = "TtcDiagnostics";
    /**
     * Time spent getting a `Symbol` from the `TemplateTypeChecker`.
     */
    PerfPhase[PerfPhase["TtcSymbol"] = 15] = "TtcSymbol";
    /**
     * Time spent by the Angular Language Service calculating a "get references" or a renaming
     * operation.
     */
    PerfPhase[PerfPhase["LsReferencesAndRenames"] = 16] = "LsReferencesAndRenames";
    /**
     * Time spent by the Angular Language Service calculating a "quick info" operation.
     */
    PerfPhase[PerfPhase["LsQuickInfo"] = 17] = "LsQuickInfo";
    /**
     * Time spent by the Angular Language Service calculating a "get type definition" or "get
     * definition" operation.
     */
    PerfPhase[PerfPhase["LsDefinition"] = 18] = "LsDefinition";
    /**
     * Time spent by the Angular Language Service calculating a "get completions" (AKA autocomplete)
     * operation.
     */
    PerfPhase[PerfPhase["LsCompletions"] = 19] = "LsCompletions";
    /**
     * Time spent by the Angular Language Service calculating a "view template typecheck block"
     * operation.
     */
    PerfPhase[PerfPhase["LsTcb"] = 20] = "LsTcb";
    /**
     * Time spent by the Angular Language Service calculating diagnostics.
     */
    PerfPhase[PerfPhase["LsDiagnostics"] = 21] = "LsDiagnostics";
    /**
     * Time spent by the Angular Language Service calculating a "get component locations for template"
     * operation.
     */
    PerfPhase[PerfPhase["LsComponentLocations"] = 22] = "LsComponentLocations";
    /**
     * Time spent by the Angular Language Service calculating signature help.
     */
    PerfPhase[PerfPhase["LsSignatureHelp"] = 23] = "LsSignatureHelp";
    /**
     * Time spent by the Angular Language Service calculating outlining spans.
     */
    PerfPhase[PerfPhase["OutliningSpans"] = 24] = "OutliningSpans";
    /**
     * Tracks the number of `PerfPhase`s, and must appear at the end of the list.
     */
    PerfPhase[PerfPhase["LAST"] = 25] = "LAST";
    /**
     * Time spent by the Angular Language Service calculating code fixes.
     */
    PerfPhase[PerfPhase["LsCodeFixes"] = 26] = "LsCodeFixes";
    /**
     * Time spent by the Angular Language Service to fix all detected same type errors.
     */
    PerfPhase[PerfPhase["LsCodeFixesAll"] = 27] = "LsCodeFixesAll";
    /**
     * Time spent computing possible Angular refactorings.
     */
    PerfPhase[PerfPhase["LSComputeApplicableRefactorings"] = 28] = "LSComputeApplicableRefactorings";
    /**
     * Time spent computing changes for applying a given refactoring.
     */
    PerfPhase[PerfPhase["LSApplyRefactoring"] = 29] = "LSApplyRefactoring";
})(PerfPhase || (PerfPhase = {}));
/**
 * Represents some occurrence during compilation, and is tracked with a counter.
 */
var PerfEvent;
(function (PerfEvent) {
    /**
     * Counts the number of `.d.ts` files in the program.
     */
    PerfEvent[PerfEvent["InputDtsFile"] = 0] = "InputDtsFile";
    /**
     * Counts the number of non-`.d.ts` files in the program.
     */
    PerfEvent[PerfEvent["InputTsFile"] = 1] = "InputTsFile";
    /**
     * An `@Component` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzeComponent"] = 2] = "AnalyzeComponent";
    /**
     * An `@Directive` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzeDirective"] = 3] = "AnalyzeDirective";
    /**
     * An `@Injectable` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzeInjectable"] = 4] = "AnalyzeInjectable";
    /**
     * An `@NgModule` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzeNgModule"] = 5] = "AnalyzeNgModule";
    /**
     * An `@Pipe` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzePipe"] = 6] = "AnalyzePipe";
    /**
     * A trait was analyzed.
     *
     * In theory, this should be the sum of the `Analyze` counters for each decorator type.
     */
    PerfEvent[PerfEvent["TraitAnalyze"] = 7] = "TraitAnalyze";
    /**
     * A trait had a prior analysis available from an incremental program, and did not need to be
     * re-analyzed.
     */
    PerfEvent[PerfEvent["TraitReuseAnalysis"] = 8] = "TraitReuseAnalysis";
    /**
     * A `ts.SourceFile` directly changed between the prior program and a new incremental compilation.
     */
    PerfEvent[PerfEvent["SourceFilePhysicalChange"] = 9] = "SourceFilePhysicalChange";
    /**
     * A `ts.SourceFile` did not physically changed, but according to the file dependency graph, has
     * logically changed between the prior program and a new incremental compilation.
     */
    PerfEvent[PerfEvent["SourceFileLogicalChange"] = 10] = "SourceFileLogicalChange";
    /**
     * A `ts.SourceFile` has not logically changed and all of its analysis results were thus available
     * for reuse.
     */
    PerfEvent[PerfEvent["SourceFileReuseAnalysis"] = 11] = "SourceFileReuseAnalysis";
    /**
     * A Type Check Block (TCB) was generated.
     */
    PerfEvent[PerfEvent["GenerateTcb"] = 12] = "GenerateTcb";
    /**
     * A Type Check Block (TCB) could not be generated because inlining was disabled, and the block
     * would've required inlining.
     */
    PerfEvent[PerfEvent["SkipGenerateTcbNoInline"] = 13] = "SkipGenerateTcbNoInline";
    /**
     * A `.ngtypecheck.ts` file could be reused from the previous program and did not need to be
     * regenerated.
     */
    PerfEvent[PerfEvent["ReuseTypeCheckFile"] = 14] = "ReuseTypeCheckFile";
    /**
     * The template type-checking program required changes and had to be updated in an incremental
     * step.
     */
    PerfEvent[PerfEvent["UpdateTypeCheckProgram"] = 15] = "UpdateTypeCheckProgram";
    /**
     * The compiler was able to prove that a `ts.SourceFile` did not need to be re-emitted.
     */
    PerfEvent[PerfEvent["EmitSkipSourceFile"] = 16] = "EmitSkipSourceFile";
    /**
     * A `ts.SourceFile` was emitted.
     */
    PerfEvent[PerfEvent["EmitSourceFile"] = 17] = "EmitSourceFile";
    /**
     * Tracks the number of `PrefEvent`s, and must appear at the end of the list.
     */
    PerfEvent[PerfEvent["LAST"] = 18] = "LAST";
})(PerfEvent || (PerfEvent = {}));
/**
 * Represents a checkpoint during compilation at which the memory usage of the compiler should be
 * recorded.
 */
var PerfCheckpoint;
(function (PerfCheckpoint) {
    /**
     * The point at which the `PerfRecorder` was created, and ideally tracks memory used before any
     * compilation structures are created.
     */
    PerfCheckpoint[PerfCheckpoint["Initial"] = 0] = "Initial";
    /**
     * The point just after the `ts.Program` has been created.
     */
    PerfCheckpoint[PerfCheckpoint["TypeScriptProgramCreate"] = 1] = "TypeScriptProgramCreate";
    /**
     * The point just before Angular analysis starts.
     *
     * In the main usage pattern for the compiler, TypeScript diagnostics have been calculated at this
     * point, so the `ts.TypeChecker` has fully ingested the current program, all `ts.Type` structures
     * and `ts.Symbol`s have been created.
     */
    PerfCheckpoint[PerfCheckpoint["PreAnalysis"] = 2] = "PreAnalysis";
    /**
     * The point just after Angular analysis completes.
     */
    PerfCheckpoint[PerfCheckpoint["Analysis"] = 3] = "Analysis";
    /**
     * The point just after Angular resolution is complete.
     */
    PerfCheckpoint[PerfCheckpoint["Resolve"] = 4] = "Resolve";
    /**
     * The point just after Type Check Blocks (TCBs) have been generated.
     */
    PerfCheckpoint[PerfCheckpoint["TtcGeneration"] = 5] = "TtcGeneration";
    /**
     * The point just after the template type-checking program has been updated with any new TCBs.
     */
    PerfCheckpoint[PerfCheckpoint["TtcUpdateProgram"] = 6] = "TtcUpdateProgram";
    /**
     * The point just before emit begins.
     *
     * In the main usage pattern for the compiler, all template type-checking diagnostics have been
     * requested at this point.
     */
    PerfCheckpoint[PerfCheckpoint["PreEmit"] = 7] = "PreEmit";
    /**
     * The point just after the program has been fully emitted.
     */
    PerfCheckpoint[PerfCheckpoint["Emit"] = 8] = "Emit";
    /**
     * Tracks the number of `PerfCheckpoint`s, and must appear at the end of the list.
     */
    PerfCheckpoint[PerfCheckpoint["LAST"] = 9] = "LAST";
})(PerfCheckpoint || (PerfCheckpoint = {}));

var TraitState;
(function (TraitState) {
    /**
     * Pending traits are freshly created and have never been analyzed.
     */
    TraitState[TraitState["Pending"] = 0] = "Pending";
    /**
     * Analyzed traits have successfully been analyzed, but are pending resolution.
     */
    TraitState[TraitState["Analyzed"] = 1] = "Analyzed";
    /**
     * Resolved traits have successfully been analyzed and resolved and are ready for compilation.
     */
    TraitState[TraitState["Resolved"] = 2] = "Resolved";
    /**
     * Skipped traits are no longer considered for compilation.
     */
    TraitState[TraitState["Skipped"] = 3] = "Skipped";
})(TraitState || (TraitState = {}));

/**
 * Generates a helper for `ImportManagerConfig` to generate unique identifiers
 * for a given source file.
 */
function createGenerateUniqueIdentifierHelper() {
    const generatedIdentifiers = new Set();
    const isGeneratedIdentifier = (sf, identifierName) => generatedIdentifiers.has(`${sf.fileName}@@${identifierName}`);
    const markIdentifierAsGenerated = (sf, identifierName) => generatedIdentifiers.add(`${sf.fileName}@@${identifierName}`);
    return (sourceFile, symbolName) => {
        const sf = sourceFile;
        if (sf.identifiers === undefined) {
            throw new Error('Source file unexpectedly lacks map of parsed `identifiers`.');
        }
        const isUniqueIdentifier = (name) => !sf.identifiers.has(name) && !isGeneratedIdentifier(sf, name);
        if (isUniqueIdentifier(symbolName)) {
            markIdentifierAsGenerated(sf, symbolName);
            return null;
        }
        let name = null;
        let counter = 1;
        do {
            name = `${symbolName}_${counter++}`;
        } while (!isUniqueIdentifier(name));
        markIdentifierAsGenerated(sf, name);
        return ts__default["default"].factory.createUniqueName(name, ts__default["default"].GeneratedIdentifierFlags.Optimistic);
    };
}

/**
 * Creates a TypeScript transform for the given import manager.
 *
 *  - The transform updates existing imports with new symbols to be added.
 *  - The transform adds new necessary imports.
 *  - The transform inserts additional optional statements after imports.
 *  - The transform deletes any nodes that are marked for deletion by the manager.
 */
function createTsTransformForImportManager(manager, extraStatementsForFiles) {
    return (ctx) => {
        const { affectedFiles, newImports, updatedImports, reusedOriginalAliasDeclarations, deletedImports, } = manager.finalize();
        // If we re-used existing source file alias declarations, mark those as referenced so TypeScript
        // doesn't drop these thinking they are unused.
        if (reusedOriginalAliasDeclarations.size > 0) {
            const referencedAliasDeclarations = loadIsReferencedAliasDeclarationPatch(ctx);
            reusedOriginalAliasDeclarations.forEach((aliasDecl) => referencedAliasDeclarations.add(aliasDecl));
        }
        // Update the set of affected files to include files that need extra statements to be inserted.
        if (extraStatementsForFiles !== undefined) {
            for (const [fileName, statements] of extraStatementsForFiles.entries()) {
                if (statements.length > 0) {
                    affectedFiles.add(fileName);
                }
            }
        }
        const visitStatement = (node) => {
            if (!ts__default["default"].isImportDeclaration(node)) {
                return node;
            }
            if (deletedImports.has(node)) {
                return undefined;
            }
            if (node.importClause === undefined || !ts__default["default"].isImportClause(node.importClause)) {
                return node;
            }
            const clause = node.importClause;
            if (clause.namedBindings === undefined ||
                !ts__default["default"].isNamedImports(clause.namedBindings) ||
                !updatedImports.has(clause.namedBindings)) {
                return node;
            }
            const newClause = ctx.factory.updateImportClause(clause, clause.isTypeOnly, clause.name, updatedImports.get(clause.namedBindings));
            const newImport = ctx.factory.updateImportDeclaration(node, node.modifiers, newClause, node.moduleSpecifier, node.attributes);
            // This tricks TypeScript into thinking that the `importClause` is still optimizable.
            // By default, TS assumes, no specifiers are elide-able if the clause of the "original
            // node" has changed. google3:
            // typescript/unstable/src/compiler/transformers/ts.ts;l=456;rcl=611254538.
            ts__default["default"].setOriginalNode(newImport, {
                importClause: newClause,
                kind: newImport.kind,
            });
            return newImport;
        };
        return (sourceFile) => {
            if (!affectedFiles.has(sourceFile.fileName)) {
                return sourceFile;
            }
            sourceFile = ts__default["default"].visitEachChild(sourceFile, visitStatement, ctx);
            // Filter out the existing imports and the source file body.
            // All new statements will be inserted between them.
            const extraStatements = extraStatementsForFiles?.get(sourceFile.fileName) ?? [];
            const existingImports = [];
            const body = [];
            for (const statement of sourceFile.statements) {
                if (isImportStatement(statement)) {
                    existingImports.push(statement);
                }
                else {
                    body.push(statement);
                }
            }
            return ctx.factory.updateSourceFile(sourceFile, [
                ...existingImports,
                ...(newImports.get(sourceFile.fileName) ?? []),
                ...extraStatements,
                ...body,
            ], sourceFile.isDeclarationFile, sourceFile.referencedFiles, sourceFile.typeReferenceDirectives, sourceFile.hasNoDefaultLib, sourceFile.libReferenceDirectives);
        };
    };
}
/** Whether the given statement is an import statement. */
function isImportStatement(stmt) {
    return (ts__default["default"].isImportDeclaration(stmt) || ts__default["default"].isImportEqualsDeclaration(stmt) || ts__default["default"].isNamespaceImport(stmt));
}

/** Attempts to efficiently re-use previous generated import requests. */
function attemptToReuseGeneratedImports(tracker, request) {
    const requestHash = hashImportRequest(request);
    // In case the given import has been already generated previously, we just return
    // the previous generated identifier in order to avoid duplicate generated imports.
    const existingExactImport = tracker.directReuseCache.get(requestHash);
    if (existingExactImport !== undefined) {
        return existingExactImport;
    }
    const potentialNamespaceImport = tracker.namespaceImportReuseCache.get(request.exportModuleSpecifier);
    if (potentialNamespaceImport === undefined) {
        return null;
    }
    if (request.exportSymbolName === null) {
        return potentialNamespaceImport;
    }
    return [potentialNamespaceImport, ts__default["default"].factory.createIdentifier(request.exportSymbolName)];
}
/** Captures the given import request and its generated reference node/path for future re-use. */
function captureGeneratedImport(request, tracker, referenceNode) {
    tracker.directReuseCache.set(hashImportRequest(request), referenceNode);
    if (request.exportSymbolName === null && !Array.isArray(referenceNode)) {
        tracker.namespaceImportReuseCache.set(request.exportModuleSpecifier, referenceNode);
    }
}
/** Generates a unique hash for the given import request. */
function hashImportRequest(req) {
    return `${req.requestedFile.fileName}:${req.exportModuleSpecifier}:${req.exportSymbolName}${req.unsafeAliasOverride ? ':' + req.unsafeAliasOverride : ''}`;
}

/** Attempts to re-use original source file imports for the given request. */
function attemptToReuseExistingSourceFileImports(tracker, sourceFile, request) {
    // Walk through all source-file top-level statements and search for import declarations
    // that already match the specified "moduleName" and can be updated to import the
    // given symbol. If no matching import can be found, the last import in the source-file
    // will be used as starting point for a new import that will be generated.
    let candidateImportToBeUpdated = null;
    for (let i = sourceFile.statements.length - 1; i >= 0; i--) {
        const statement = sourceFile.statements[i];
        if (!ts__default["default"].isImportDeclaration(statement) || !ts__default["default"].isStringLiteral(statement.moduleSpecifier)) {
            continue;
        }
        // Side-effect imports are ignored, or type-only imports.
        // TODO: Consider re-using type-only imports efficiently.
        if (!statement.importClause || statement.importClause.isTypeOnly) {
            continue;
        }
        const moduleSpecifier = statement.moduleSpecifier.text;
        // If the import does not match the module name, or requested target file, continue.
        // Note: In the future, we may consider performing better analysis here. E.g. resolve paths,
        // or try to detect re-usable symbols via type-checking.
        if (moduleSpecifier !== request.exportModuleSpecifier) {
            continue;
        }
        if (statement.importClause.namedBindings) {
            const namedBindings = statement.importClause.namedBindings;
            // A namespace import can be reused.
            if (ts__default["default"].isNamespaceImport(namedBindings)) {
                tracker.reusedAliasDeclarations.add(namedBindings);
                if (request.exportSymbolName === null) {
                    return namedBindings.name;
                }
                return [namedBindings.name, ts__default["default"].factory.createIdentifier(request.exportSymbolName)];
            }
            // Named imports can be re-used if a specific symbol is requested.
            if (ts__default["default"].isNamedImports(namedBindings) && request.exportSymbolName !== null) {
                const existingElement = namedBindings.elements.find((e) => {
                    // TODO: Consider re-using type-only imports efficiently.
                    let nameMatches;
                    if (request.unsafeAliasOverride) {
                        // If a specific alias is passed, both the original name and alias have to match.
                        nameMatches =
                            e.propertyName?.text === request.exportSymbolName &&
                                e.name.text === request.unsafeAliasOverride;
                    }
                    else {
                        nameMatches = e.propertyName
                            ? e.propertyName.text === request.exportSymbolName
                            : e.name.text === request.exportSymbolName;
                    }
                    return !e.isTypeOnly && nameMatches;
                });
                if (existingElement !== undefined) {
                    tracker.reusedAliasDeclarations.add(existingElement);
                    return existingElement.name;
                }
                // In case the symbol could not be found in an existing import, we
                // keep track of the import declaration as it can be updated to include
                // the specified symbol name without having to create a new import.
                candidateImportToBeUpdated = statement;
            }
        }
    }
    if (candidateImportToBeUpdated === null || request.exportSymbolName === null) {
        return null;
    }
    // We have a candidate import. Update it to import what we need.
    if (!tracker.updatedImports.has(candidateImportToBeUpdated)) {
        tracker.updatedImports.set(candidateImportToBeUpdated, []);
    }
    const symbolsToBeImported = tracker.updatedImports.get(candidateImportToBeUpdated);
    const propertyName = ts__default["default"].factory.createIdentifier(request.exportSymbolName);
    const fileUniqueAlias = request.unsafeAliasOverride
        ? ts__default["default"].factory.createIdentifier(request.unsafeAliasOverride)
        : tracker.generateUniqueIdentifier(sourceFile, request.exportSymbolName);
    // Since it can happen that multiple classes need to be imported within the
    // specified source file and we want to add the identifiers to the existing
    // import declaration, we need to keep track of the updated import declarations.
    // We can't directly update the import declaration for each identifier as this
    // would not be reflected in the AST— or would throw of update recording offsets.
    symbolsToBeImported.push({
        propertyName,
        fileUniqueAlias,
    });
    return fileUniqueAlias ?? propertyName;
}

/**
 * Import manager that can be used to conveniently and efficiently generate
 * imports It efficiently re-uses existing source file imports, or previous
 * generated imports.
 *
 * These capabilities are important for efficient TypeScript transforms that
 * minimize structural changes to the dependency graph of source files, enabling
 * as much incremental re-use as possible.
 *
 * Those imports may be inserted via a TypeScript transform, or via manual string
 * manipulation using e.g. `magic-string`.
 */
class ImportManager {
    constructor(config = {}) {
        /** List of new imports that will be inserted into given source files. */
        this.newImports = new Map();
        /**
         * Keeps track of imports marked for removal. The root-level key is the file from which the
         * import should be removed, the inner map key is the name of the module from which the symbol
         * is being imported. The value of the inner map is a set of symbol names that should be removed.
         * Note! the inner map tracks the original names of the imported symbols, not their local aliases.
         */
        this.removedImports = new Map();
        this.nextUniqueIndex = 0;
        this.reuseGeneratedImportsTracker = {
            directReuseCache: new Map(),
            namespaceImportReuseCache: new Map(),
        };
        this.config = {
            shouldUseSingleQuotes: config.shouldUseSingleQuotes ?? (() => false),
            rewriter: config.rewriter ?? null,
            disableOriginalSourceFileReuse: config.disableOriginalSourceFileReuse ?? false,
            forceGenerateNamespacesForNewImports: config.forceGenerateNamespacesForNewImports ?? false,
            namespaceImportPrefix: config.namespaceImportPrefix ?? 'i',
            generateUniqueIdentifier: config.generateUniqueIdentifier ?? createGenerateUniqueIdentifierHelper(),
        };
        this.reuseSourceFileImportsTracker = {
            generateUniqueIdentifier: this.config.generateUniqueIdentifier,
            reusedAliasDeclarations: new Set(),
            updatedImports: new Map(),
        };
    }
    /** Adds a side-effect import for the given module. */
    addSideEffectImport(requestedFile, moduleSpecifier) {
        if (this.config.rewriter !== null) {
            moduleSpecifier = this.config.rewriter.rewriteSpecifier(moduleSpecifier, requestedFile.fileName);
        }
        this._getNewImportsTrackerForFile(requestedFile).sideEffectImports.add(moduleSpecifier);
    }
    addImport(request) {
        if (this.config.rewriter !== null) {
            if (request.exportSymbolName !== null) {
                request.exportSymbolName = this.config.rewriter.rewriteSymbol(request.exportSymbolName, request.exportModuleSpecifier);
            }
            request.exportModuleSpecifier = this.config.rewriter.rewriteSpecifier(request.exportModuleSpecifier, request.requestedFile.fileName);
        }
        // Remove the newly-added import from the set of removed imports.
        if (request.exportSymbolName !== null && !request.asTypeReference) {
            this.removedImports
                .get(request.requestedFile)
                ?.get(request.exportModuleSpecifier)
                ?.delete(request.exportSymbolName);
        }
        // Attempt to re-use previous identical import requests.
        const previousGeneratedImportRef = attemptToReuseGeneratedImports(this.reuseGeneratedImportsTracker, request);
        if (previousGeneratedImportRef !== null) {
            return createImportReference(!!request.asTypeReference, previousGeneratedImportRef);
        }
        // Generate a new one, and cache it.
        const resultImportRef = this._generateNewImport(request);
        captureGeneratedImport(request, this.reuseGeneratedImportsTracker, resultImportRef);
        return createImportReference(!!request.asTypeReference, resultImportRef);
    }
    /**
     * Marks all imported symbols with a specific name for removal.
     * Call `addImport` to undo this operation.
     * @param requestedFile File from which to remove the imports.
     * @param exportSymbolName Declared name of the symbol being removed.
     * @param moduleSpecifier Module from which the symbol is being imported.
     */
    removeImport(requestedFile, exportSymbolName, moduleSpecifier) {
        let moduleMap = this.removedImports.get(requestedFile);
        if (!moduleMap) {
            moduleMap = new Map();
            this.removedImports.set(requestedFile, moduleMap);
        }
        let removedSymbols = moduleMap.get(moduleSpecifier);
        if (!removedSymbols) {
            removedSymbols = new Set();
            moduleMap.set(moduleSpecifier, removedSymbols);
        }
        removedSymbols.add(exportSymbolName);
    }
    _generateNewImport(request) {
        const { requestedFile: sourceFile } = request;
        const disableOriginalSourceFileReuse = this.config.disableOriginalSourceFileReuse;
        const forceGenerateNamespacesForNewImports = this.config.forceGenerateNamespacesForNewImports;
        // If desired, attempt to re-use original source file imports as a base, or as much as possible.
        // This may involve updates to existing import named bindings.
        if (!disableOriginalSourceFileReuse) {
            const reuseResult = attemptToReuseExistingSourceFileImports(this.reuseSourceFileImportsTracker, sourceFile, request);
            if (reuseResult !== null) {
                return reuseResult;
            }
        }
        // A new import needs to be generated.
        // No candidate existing import was found.
        const { namedImports, namespaceImports } = this._getNewImportsTrackerForFile(sourceFile);
        // If a namespace import is requested, or the symbol should be forcibly
        // imported through namespace imports:
        if (request.exportSymbolName === null || forceGenerateNamespacesForNewImports) {
            let namespaceImportName = `${this.config.namespaceImportPrefix}${this.nextUniqueIndex++}`;
            if (this.config.rewriter) {
                namespaceImportName = this.config.rewriter.rewriteNamespaceImportIdentifier(namespaceImportName, request.exportModuleSpecifier);
            }
            const namespaceImport = ts__default["default"].factory.createNamespaceImport(this.config.generateUniqueIdentifier(sourceFile, namespaceImportName) ??
                ts__default["default"].factory.createIdentifier(namespaceImportName));
            namespaceImports.set(request.exportModuleSpecifier, namespaceImport);
            // Capture the generated namespace import alone, to allow re-use.
            captureGeneratedImport({ ...request, exportSymbolName: null }, this.reuseGeneratedImportsTracker, namespaceImport.name);
            if (request.exportSymbolName !== null) {
                return [namespaceImport.name, ts__default["default"].factory.createIdentifier(request.exportSymbolName)];
            }
            return namespaceImport.name;
        }
        // Otherwise, an individual named import is requested.
        if (!namedImports.has(request.exportModuleSpecifier)) {
            namedImports.set(request.exportModuleSpecifier, []);
        }
        const exportSymbolName = ts__default["default"].factory.createIdentifier(request.exportSymbolName);
        const fileUniqueName = request.unsafeAliasOverride
            ? null
            : this.config.generateUniqueIdentifier(sourceFile, request.exportSymbolName);
        let needsAlias;
        let specifierName;
        if (request.unsafeAliasOverride) {
            needsAlias = true;
            specifierName = ts__default["default"].factory.createIdentifier(request.unsafeAliasOverride);
        }
        else if (fileUniqueName !== null) {
            needsAlias = true;
            specifierName = fileUniqueName;
        }
        else {
            needsAlias = false;
            specifierName = exportSymbolName;
        }
        namedImports
            .get(request.exportModuleSpecifier)
            .push(ts__default["default"].factory.createImportSpecifier(false, needsAlias ? exportSymbolName : undefined, specifierName));
        return specifierName;
    }
    /**
     * Finalizes the import manager by computing all necessary import changes
     * and returning them.
     *
     * Changes are collected once at the end, after all imports are requested,
     * because this simplifies building up changes to existing imports that need
     * to be updated, and allows more trivial re-use of previous generated imports.
     */
    finalize() {
        const affectedFiles = new Set();
        const updatedImportsResult = new Map();
        const newImportsResult = new Map();
        const deletedImports = new Set();
        const importDeclarationsPerFile = new Map();
        const addNewImport = (fileName, importDecl) => {
            affectedFiles.add(fileName);
            if (newImportsResult.has(fileName)) {
                newImportsResult.get(fileName).push(importDecl);
            }
            else {
                newImportsResult.set(fileName, [importDecl]);
            }
        };
        // Collect original source file imports that need to be updated.
        this.reuseSourceFileImportsTracker.updatedImports.forEach((expressions, importDecl) => {
            const sourceFile = importDecl.getSourceFile();
            const namedBindings = importDecl.importClause.namedBindings;
            const moduleName = importDecl.moduleSpecifier.text;
            const newElements = namedBindings.elements
                .concat(expressions.map(({ propertyName, fileUniqueAlias }) => ts__default["default"].factory.createImportSpecifier(false, fileUniqueAlias !== null ? propertyName : undefined, fileUniqueAlias ?? propertyName)))
                .filter((specifier) => this._canAddSpecifier(sourceFile, moduleName, specifier));
            affectedFiles.add(sourceFile.fileName);
            if (newElements.length === 0) {
                deletedImports.add(importDecl);
            }
            else {
                updatedImportsResult.set(namedBindings, ts__default["default"].factory.updateNamedImports(namedBindings, newElements));
            }
        });
        this.removedImports.forEach((removeMap, sourceFile) => {
            if (removeMap.size === 0) {
                return;
            }
            let allImports = importDeclarationsPerFile.get(sourceFile);
            if (!allImports) {
                allImports = sourceFile.statements.filter(ts__default["default"].isImportDeclaration);
                importDeclarationsPerFile.set(sourceFile, allImports);
            }
            for (const node of allImports) {
                if (!node.importClause?.namedBindings ||
                    !ts__default["default"].isNamedImports(node.importClause.namedBindings) ||
                    this.reuseSourceFileImportsTracker.updatedImports.has(node) ||
                    deletedImports.has(node)) {
                    continue;
                }
                const namedBindings = node.importClause.namedBindings;
                const moduleName = node.moduleSpecifier.text;
                const newImports = namedBindings.elements.filter((specifier) => this._canAddSpecifier(sourceFile, moduleName, specifier));
                if (newImports.length === 0) {
                    affectedFiles.add(sourceFile.fileName);
                    deletedImports.add(node);
                }
                else if (newImports.length !== namedBindings.elements.length) {
                    affectedFiles.add(sourceFile.fileName);
                    updatedImportsResult.set(namedBindings, ts__default["default"].factory.updateNamedImports(namedBindings, newImports));
                }
            }
        });
        // Collect all new imports to be added. Named imports, namespace imports or side-effects.
        this.newImports.forEach(({ namedImports, namespaceImports, sideEffectImports }, sourceFile) => {
            const useSingleQuotes = this.config.shouldUseSingleQuotes(sourceFile);
            const fileName = sourceFile.fileName;
            sideEffectImports.forEach((moduleName) => {
                addNewImport(fileName, ts__default["default"].factory.createImportDeclaration(undefined, undefined, ts__default["default"].factory.createStringLiteral(moduleName)));
            });
            namespaceImports.forEach((namespaceImport, moduleName) => {
                const newImport = ts__default["default"].factory.createImportDeclaration(undefined, ts__default["default"].factory.createImportClause(false, undefined, namespaceImport), ts__default["default"].factory.createStringLiteral(moduleName, useSingleQuotes));
                // IMPORTANT: Set the original TS node to the `ts.ImportDeclaration`. This allows
                // downstream transforms such as tsickle to properly process references to this import.
                //
                // This operation is load-bearing in g3 as some imported modules contain special metadata
                // generated by clutz, which tsickle uses to transform imports and references to those
                // imports. See: `google3: node_modules/tsickle/src/googmodule.ts;l=637-640;rcl=615418148`
                ts__default["default"].setOriginalNode(namespaceImport.name, newImport);
                addNewImport(fileName, newImport);
            });
            namedImports.forEach((specifiers, moduleName) => {
                const filteredSpecifiers = specifiers.filter((specifier) => this._canAddSpecifier(sourceFile, moduleName, specifier));
                if (filteredSpecifiers.length > 0) {
                    const newImport = ts__default["default"].factory.createImportDeclaration(undefined, ts__default["default"].factory.createImportClause(false, undefined, ts__default["default"].factory.createNamedImports(filteredSpecifiers)), ts__default["default"].factory.createStringLiteral(moduleName, useSingleQuotes));
                    addNewImport(fileName, newImport);
                }
            });
        });
        return {
            affectedFiles,
            newImports: newImportsResult,
            updatedImports: updatedImportsResult,
            reusedOriginalAliasDeclarations: this.reuseSourceFileImportsTracker.reusedAliasDeclarations,
            deletedImports,
        };
    }
    /**
     * Gets a TypeScript transform for the import manager.
     *
     * @param extraStatementsMap Additional set of statements to be inserted
     *   for given source files after their imports. E.g. top-level constants.
     */
    toTsTransform(extraStatementsMap) {
        return createTsTransformForImportManager(this, extraStatementsMap);
    }
    /**
     * Transforms a single file as a shorthand, using {@link toTsTransform}.
     *
     * @param extraStatementsMap Additional set of statements to be inserted
     *   for given source files after their imports. E.g. top-level constants.
     */
    transformTsFile(ctx, file, extraStatementsAfterImports) {
        const extraStatementsMap = extraStatementsAfterImports
            ? new Map([[file.fileName, extraStatementsAfterImports]])
            : undefined;
        return this.toTsTransform(extraStatementsMap)(ctx)(file);
    }
    _getNewImportsTrackerForFile(file) {
        if (!this.newImports.has(file)) {
            this.newImports.set(file, {
                namespaceImports: new Map(),
                namedImports: new Map(),
                sideEffectImports: new Set(),
            });
        }
        return this.newImports.get(file);
    }
    _canAddSpecifier(sourceFile, moduleSpecifier, specifier) {
        return !this.removedImports
            .get(sourceFile)
            ?.get(moduleSpecifier)
            ?.has((specifier.propertyName || specifier.name).text);
    }
}
/** Creates an import reference based on the given identifier, or nested access. */
function createImportReference(asTypeReference, ref) {
    if (asTypeReference) {
        return Array.isArray(ref) ? ts__default["default"].factory.createQualifiedName(ref[0], ref[1]) : ref;
    }
    else {
        return Array.isArray(ref) ? ts__default["default"].factory.createPropertyAccessExpression(ref[0], ref[1]) : ref;
    }
}

new Map([
    [checker.UnaryOperator.Minus, '-'],
    [checker.UnaryOperator.Plus, '+'],
]);
new Map([
    [checker.BinaryOperator.And, '&&'],
    [checker.BinaryOperator.Bigger, '>'],
    [checker.BinaryOperator.BiggerEquals, '>='],
    [checker.BinaryOperator.BitwiseAnd, '&'],
    [checker.BinaryOperator.BitwiseOr, '|'],
    [checker.BinaryOperator.Divide, '/'],
    [checker.BinaryOperator.Equals, '=='],
    [checker.BinaryOperator.Identical, '==='],
    [checker.BinaryOperator.Lower, '<'],
    [checker.BinaryOperator.LowerEquals, '<='],
    [checker.BinaryOperator.Minus, '-'],
    [checker.BinaryOperator.Modulo, '%'],
    [checker.BinaryOperator.Multiply, '*'],
    [checker.BinaryOperator.NotEquals, '!='],
    [checker.BinaryOperator.NotIdentical, '!=='],
    [checker.BinaryOperator.Or, '||'],
    [checker.BinaryOperator.Plus, '+'],
    [checker.BinaryOperator.NullishCoalesce, '??'],
]);

const INELIGIBLE = {};
/**
 * Determines whether the provided type can be emitted, which means that it can be safely emitted
 * into a different location.
 *
 * If this function returns true, a `TypeEmitter` should be able to succeed. Vice versa, if this
 * function returns false, then using the `TypeEmitter` should not be attempted as it is known to
 * fail.
 */
function canEmitType(type, canEmit) {
    return canEmitTypeWorker(type);
    function canEmitTypeWorker(type) {
        return visitNode(type) !== INELIGIBLE;
    }
    // To determine whether a type can be emitted, we have to recursively look through all type nodes.
    // If an unsupported type node is found at any position within the type, then the `INELIGIBLE`
    // constant is returned to stop the recursive walk as the type as a whole cannot be emitted in
    // that case. Otherwise, the result of visiting all child nodes determines the result. If no
    // ineligible type reference node is found then the walk returns `undefined`, indicating that
    // no type node was visited that could not be emitted.
    function visitNode(node) {
        // `import('module')` type nodes are not supported, as it may require rewriting the module
        // specifier which is currently not done.
        if (ts__default["default"].isImportTypeNode(node)) {
            return INELIGIBLE;
        }
        // Emitting a type reference node in a different context requires that an import for the type
        // can be created. If a type reference node cannot be emitted, `INELIGIBLE` is returned to stop
        // the walk.
        if (ts__default["default"].isTypeReferenceNode(node) && !canEmitTypeReference(node)) {
            return INELIGIBLE;
        }
        else {
            return ts__default["default"].forEachChild(node, visitNode);
        }
    }
    function canEmitTypeReference(type) {
        if (!canEmit(type)) {
            return false;
        }
        // The type can be emitted if either it does not have any type arguments, or all of them can be
        // emitted.
        return type.typeArguments === undefined || type.typeArguments.every(canEmitTypeWorker);
    }
}
/**
 * Given a `ts.TypeNode`, this class derives an equivalent `ts.TypeNode` that has been emitted into
 * a different context.
 *
 * For example, consider the following code:
 *
 * ```
 * import {NgIterable} from '@angular/core';
 *
 * class NgForOf<T, U extends NgIterable<T>> {}
 * ```
 *
 * Here, the generic type parameters `T` and `U` can be emitted into a different context, as the
 * type reference to `NgIterable` originates from an absolute module import so that it can be
 * emitted anywhere, using that same module import. The process of emitting translates the
 * `NgIterable` type reference to a type reference that is valid in the context in which it is
 * emitted, for example:
 *
 * ```
 * import * as i0 from '@angular/core';
 * import * as i1 from '@angular/common';
 *
 * const _ctor1: <T, U extends i0.NgIterable<T>>(o: Pick<i1.NgForOf<T, U>, 'ngForOf'>):
 * i1.NgForOf<T, U>;
 * ```
 *
 * Notice how the type reference for `NgIterable` has been translated into a qualified name,
 * referring to the namespace import that was created.
 */
class TypeEmitter {
    constructor(translator) {
        this.translator = translator;
    }
    emitType(type) {
        const typeReferenceTransformer = (context) => {
            const visitNode = (node) => {
                if (ts__default["default"].isImportTypeNode(node)) {
                    throw new Error('Unable to emit import type');
                }
                if (ts__default["default"].isTypeReferenceNode(node)) {
                    return this.emitTypeReference(node);
                }
                else if (ts__default["default"].isLiteralExpression(node)) {
                    // TypeScript would typically take the emit text for a literal expression from the source
                    // file itself. As the type node is being emitted into a different file, however,
                    // TypeScript would extract the literal text from the wrong source file. To mitigate this
                    // issue the literal is cloned and explicitly marked as synthesized by setting its text
                    // range to a negative range, forcing TypeScript to determine the node's literal text from
                    // the synthesized node's text instead of the incorrect source file.
                    let clone;
                    if (ts__default["default"].isStringLiteral(node)) {
                        clone = ts__default["default"].factory.createStringLiteral(node.text);
                    }
                    else if (ts__default["default"].isNumericLiteral(node)) {
                        clone = ts__default["default"].factory.createNumericLiteral(node.text);
                    }
                    else if (ts__default["default"].isBigIntLiteral(node)) {
                        clone = ts__default["default"].factory.createBigIntLiteral(node.text);
                    }
                    else if (ts__default["default"].isNoSubstitutionTemplateLiteral(node)) {
                        clone = ts__default["default"].factory.createNoSubstitutionTemplateLiteral(node.text, node.rawText);
                    }
                    else if (ts__default["default"].isRegularExpressionLiteral(node)) {
                        clone = ts__default["default"].factory.createRegularExpressionLiteral(node.text);
                    }
                    else {
                        throw new Error(`Unsupported literal kind ${ts__default["default"].SyntaxKind[node.kind]}`);
                    }
                    ts__default["default"].setTextRange(clone, { pos: -1, end: -1 });
                    return clone;
                }
                else {
                    return ts__default["default"].visitEachChild(node, visitNode, context);
                }
            };
            return (node) => ts__default["default"].visitNode(node, visitNode, ts__default["default"].isTypeNode);
        };
        return ts__default["default"].transform(type, [typeReferenceTransformer]).transformed[0];
    }
    emitTypeReference(type) {
        // Determine the reference that the type corresponds with.
        const translatedType = this.translator(type);
        if (translatedType === null) {
            throw new Error('Unable to emit an unresolved reference');
        }
        // Emit the type arguments, if any.
        let typeArguments = undefined;
        if (type.typeArguments !== undefined) {
            typeArguments = ts__default["default"].factory.createNodeArray(type.typeArguments.map((typeArg) => this.emitType(typeArg)));
        }
        return ts__default["default"].factory.updateTypeReferenceNode(type, translatedType.typeName, typeArguments);
    }
}

/**
 * Different optimizers use different annotations on a function or method call to indicate its pure
 * status.
 */
var PureAnnotation;
(function (PureAnnotation) {
    /**
     * Closure's annotation for purity is `@pureOrBreakMyCode`, but this needs to be in a semantic
     * (jsdoc) enabled comment. Thus, the actual comment text for Closure must include the `*` that
     * turns a `/*` comment into a `/**` comment, as well as surrounding whitespace.
     */
    PureAnnotation["CLOSURE"] = "* @pureOrBreakMyCode ";
    PureAnnotation["TERSER"] = "@__PURE__";
})(PureAnnotation || (PureAnnotation = {}));
({
    '+': ts__default["default"].SyntaxKind.PlusToken,
    '-': ts__default["default"].SyntaxKind.MinusToken,
    '!': ts__default["default"].SyntaxKind.ExclamationToken,
});
({
    '&&': ts__default["default"].SyntaxKind.AmpersandAmpersandToken,
    '>': ts__default["default"].SyntaxKind.GreaterThanToken,
    '>=': ts__default["default"].SyntaxKind.GreaterThanEqualsToken,
    '&': ts__default["default"].SyntaxKind.AmpersandToken,
    '|': ts__default["default"].SyntaxKind.BarToken,
    '/': ts__default["default"].SyntaxKind.SlashToken,
    '==': ts__default["default"].SyntaxKind.EqualsEqualsToken,
    '===': ts__default["default"].SyntaxKind.EqualsEqualsEqualsToken,
    '<': ts__default["default"].SyntaxKind.LessThanToken,
    '<=': ts__default["default"].SyntaxKind.LessThanEqualsToken,
    '-': ts__default["default"].SyntaxKind.MinusToken,
    '%': ts__default["default"].SyntaxKind.PercentToken,
    '*': ts__default["default"].SyntaxKind.AsteriskToken,
    '!=': ts__default["default"].SyntaxKind.ExclamationEqualsToken,
    '!==': ts__default["default"].SyntaxKind.ExclamationEqualsEqualsToken,
    '||': ts__default["default"].SyntaxKind.BarBarToken,
    '+': ts__default["default"].SyntaxKind.PlusToken,
    '??': ts__default["default"].SyntaxKind.QuestionQuestionToken,
});
({
    'const': ts__default["default"].NodeFlags.Const,
    'let': ts__default["default"].NodeFlags.Let,
    'var': ts__default["default"].NodeFlags.None,
});

var ComponentScopeKind;
(function (ComponentScopeKind) {
    ComponentScopeKind[ComponentScopeKind["NgModule"] = 0] = "NgModule";
    ComponentScopeKind[ComponentScopeKind["Standalone"] = 1] = "Standalone";
})(ComponentScopeKind || (ComponentScopeKind = {}));

/** Represents a function that can declare an input. */
({
    functionName: 'input',
    owningModule: '@angular/core',
    // Inputs are accessed from parents, via the `property` instruction.
    // Conceptually, the fields need to be publicly readable, but in practice,
    // accessing `protected` or `private` members works at runtime, so we can allow
    // cases where the input is intentionally not part of the public API, programmatically.
    // Note: `private` is omitted intentionally as this would be a conceptual confusion point.
    allowedAccessLevels: [
        ClassMemberAccessLevel.PublicWritable,
        ClassMemberAccessLevel.PublicReadonly,
        ClassMemberAccessLevel.Protected,
    ],
});

/** Represents a function that can declare a model. */
({
    functionName: 'model',
    owningModule: '@angular/core',
    // Inputs are accessed from parents, via the `property` instruction.
    // Conceptually, the fields need to be publicly readable, but in practice,
    // accessing `protected` or `private` members works at runtime, so we can allow
    // cases where the input is intentionally not part of the public API, programmatically.
    allowedAccessLevels: [
        ClassMemberAccessLevel.PublicWritable,
        ClassMemberAccessLevel.PublicReadonly,
        ClassMemberAccessLevel.Protected,
    ],
});

// Outputs are accessed from parents, via the `listener` instruction.
// Conceptually, the fields need to be publicly readable, but in practice,
// accessing `protected` or `private` members works at runtime, so we can allow
// such outputs that may not want to expose the `OutputRef` as part of the
// component API, programmatically.
// Note: `private` is omitted intentionally as this would be a conceptual confusion point.
[
    ClassMemberAccessLevel.PublicWritable,
    ClassMemberAccessLevel.PublicReadonly,
    ClassMemberAccessLevel.Protected,
];

/** Possible names of query initializer APIs. */
const queryFunctionNames = [
    'viewChild',
    'viewChildren',
    'contentChild',
    'contentChildren',
];
/** Possible query initializer API functions. */
queryFunctionNames.map((fnName) => ({
    functionName: fnName,
    owningModule: '@angular/core',
    // Queries are accessed from within static blocks, via the query definition functions.
    // Conceptually, the fields could access private members— even ES private fields.
    // Support for ES private fields requires special caution and complexity when partial
    // output is linked— hence not supported. TS private members are allowed in static blocks.
    allowedAccessLevels: [
        ClassMemberAccessLevel.PublicWritable,
        ClassMemberAccessLevel.PublicReadonly,
        ClassMemberAccessLevel.Protected,
        ClassMemberAccessLevel.Private,
    ],
}));

var UpdateMode;
(function (UpdateMode) {
    /**
     * A complete update creates a completely new overlay of type-checking code on top of the user's
     * original program, which doesn't include type-checking code from previous calls to
     * `updateFiles`.
     */
    UpdateMode[UpdateMode["Complete"] = 0] = "Complete";
    /**
     * An incremental update changes the contents of some files in the type-checking program without
     * reverting any prior changes.
     */
    UpdateMode[UpdateMode["Incremental"] = 1] = "Incremental";
})(UpdateMode || (UpdateMode = {}));

/**
 * Describes the scope of the caller's interest in template type-checking results.
 */
var OptimizeFor;
(function (OptimizeFor) {
    /**
     * Indicates that a consumer of a `TemplateTypeChecker` is only interested in results for a
     * given file, and wants them as fast as possible.
     *
     * Calling `TemplateTypeChecker` methods successively for multiple files while specifying
     * `OptimizeFor.SingleFile` can result in significant unnecessary overhead overall.
     */
    OptimizeFor[OptimizeFor["SingleFile"] = 0] = "SingleFile";
    /**
     * Indicates that a consumer of a `TemplateTypeChecker` intends to query for results pertaining
     * to the entire user program, and so the type-checker should internally optimize for this case.
     *
     * Initial calls to retrieve type-checking information may take longer, but repeated calls to
     * gather information for the whole user program will be significantly faster with this mode of
     * optimization.
     */
    OptimizeFor[OptimizeFor["WholeProgram"] = 1] = "WholeProgram";
})(OptimizeFor || (OptimizeFor = {}));

/**
 * Discriminant of an autocompletion source (a `Completion`).
 */
var CompletionKind;
(function (CompletionKind) {
    CompletionKind[CompletionKind["Reference"] = 0] = "Reference";
    CompletionKind[CompletionKind["Variable"] = 1] = "Variable";
    CompletionKind[CompletionKind["LetDeclaration"] = 2] = "LetDeclaration";
})(CompletionKind || (CompletionKind = {}));

/**
 * Which kind of Angular Trait the import targets.
 */
var PotentialImportKind;
(function (PotentialImportKind) {
    PotentialImportKind[PotentialImportKind["NgModule"] = 0] = "NgModule";
    PotentialImportKind[PotentialImportKind["Standalone"] = 1] = "Standalone";
})(PotentialImportKind || (PotentialImportKind = {}));
/**
 * Possible modes in which to look up a potential import.
 */
var PotentialImportMode;
(function (PotentialImportMode) {
    /** Whether an import is standalone is inferred based on its metadata. */
    PotentialImportMode[PotentialImportMode["Normal"] = 0] = "Normal";
    /**
     * An import is assumed to be standalone and is imported directly. This is useful for migrations
     * where a declaration wasn't standalone when the program was created, but will become standalone
     * as a part of the migration.
     */
    PotentialImportMode[PotentialImportMode["ForceDirect"] = 1] = "ForceDirect";
})(PotentialImportMode || (PotentialImportMode = {}));

var SymbolKind;
(function (SymbolKind) {
    SymbolKind[SymbolKind["Input"] = 0] = "Input";
    SymbolKind[SymbolKind["Output"] = 1] = "Output";
    SymbolKind[SymbolKind["Binding"] = 2] = "Binding";
    SymbolKind[SymbolKind["Reference"] = 3] = "Reference";
    SymbolKind[SymbolKind["Variable"] = 4] = "Variable";
    SymbolKind[SymbolKind["Directive"] = 5] = "Directive";
    SymbolKind[SymbolKind["Element"] = 6] = "Element";
    SymbolKind[SymbolKind["Template"] = 7] = "Template";
    SymbolKind[SymbolKind["Expression"] = 8] = "Expression";
    SymbolKind[SymbolKind["DomBinding"] = 9] = "DomBinding";
    SymbolKind[SymbolKind["Pipe"] = 10] = "Pipe";
    SymbolKind[SymbolKind["LetDeclaration"] = 11] = "LetDeclaration";
})(SymbolKind || (SymbolKind = {}));

/** Used to identify what type the comment is. */
var CommentTriviaType;
(function (CommentTriviaType) {
    CommentTriviaType["DIAGNOSTIC"] = "D";
    CommentTriviaType["EXPRESSION_TYPE_IDENTIFIER"] = "T";
})(CommentTriviaType || (CommentTriviaType = {}));
/** Identifies what the TCB expression is for (for example, a directive declaration). */
var ExpressionIdentifier;
(function (ExpressionIdentifier) {
    ExpressionIdentifier["DIRECTIVE"] = "DIR";
    ExpressionIdentifier["COMPONENT_COMPLETION"] = "COMPCOMP";
    ExpressionIdentifier["EVENT_PARAMETER"] = "EP";
    ExpressionIdentifier["VARIABLE_AS_EXPRESSION"] = "VAE";
})(ExpressionIdentifier || (ExpressionIdentifier = {}));
/** Tags the node with the given expression identifier. */
function addExpressionIdentifier(node, identifier) {
    ts__default["default"].addSyntheticTrailingComment(node, ts__default["default"].SyntaxKind.MultiLineCommentTrivia, `${CommentTriviaType.EXPRESSION_TYPE_IDENTIFIER}:${identifier}`, 
    /* hasTrailingNewLine */ false);
}
const IGNORE_FOR_DIAGNOSTICS_MARKER = `${CommentTriviaType.DIAGNOSTIC}:ignore`;
/**
 * Tag the `ts.Node` with an indication that any errors arising from the evaluation of the node
 * should be ignored.
 */
function markIgnoreDiagnostics(node) {
    ts__default["default"].addSyntheticTrailingComment(node, ts__default["default"].SyntaxKind.MultiLineCommentTrivia, IGNORE_FOR_DIAGNOSTICS_MARKER, 
    /* hasTrailingNewLine */ false);
}

new checker.DomElementSchemaRegistry();

/**
 * A `Set` of `ts.SyntaxKind`s of `ts.Expression` which are safe to wrap in a `ts.AsExpression`
 * without needing to be wrapped in parentheses.
 *
 * For example, `foo.bar()` is a `ts.CallExpression`, and can be safely cast to `any` with
 * `foo.bar() as any`. however, `foo !== bar` is a `ts.BinaryExpression`, and attempting to cast
 * without the parentheses yields the expression `foo !== bar as any`. This is semantically
 * equivalent to `foo !== (bar as any)`, which is not what was intended. Thus,
 * `ts.BinaryExpression`s need to be wrapped in parentheses before casting.
 */
//
const SAFE_TO_CAST_WITHOUT_PARENS = new Set([
    // Expressions which are already parenthesized can be cast without further wrapping.
    ts__default["default"].SyntaxKind.ParenthesizedExpression,
    // Expressions which form a single lexical unit leave no room for precedence issues with the cast.
    ts__default["default"].SyntaxKind.Identifier,
    ts__default["default"].SyntaxKind.CallExpression,
    ts__default["default"].SyntaxKind.NonNullExpression,
    ts__default["default"].SyntaxKind.ElementAccessExpression,
    ts__default["default"].SyntaxKind.PropertyAccessExpression,
    ts__default["default"].SyntaxKind.ArrayLiteralExpression,
    ts__default["default"].SyntaxKind.ObjectLiteralExpression,
    // The same goes for various literals.
    ts__default["default"].SyntaxKind.StringLiteral,
    ts__default["default"].SyntaxKind.NumericLiteral,
    ts__default["default"].SyntaxKind.TrueKeyword,
    ts__default["default"].SyntaxKind.FalseKeyword,
    ts__default["default"].SyntaxKind.NullKeyword,
    ts__default["default"].SyntaxKind.UndefinedKeyword,
]);
function tsCastToAny(expr) {
    // Wrap `expr` in parentheses if needed (see `SAFE_TO_CAST_WITHOUT_PARENS` above).
    if (!SAFE_TO_CAST_WITHOUT_PARENS.has(expr.kind)) {
        expr = ts__default["default"].factory.createParenthesizedExpression(expr);
    }
    // The outer expression is always wrapped in parentheses.
    return ts__default["default"].factory.createParenthesizedExpression(ts__default["default"].factory.createAsExpression(expr, ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword)));
}
/**
 * Create an expression which instantiates an element by its HTML tagName.
 *
 * Thanks to narrowing of `document.createElement()`, this expression will have its type inferred
 * based on the tag name, including for custom elements that have appropriate .d.ts definitions.
 */
function tsCreateElement(tagName) {
    const createElement = ts__default["default"].factory.createPropertyAccessExpression(
    /* expression */ ts__default["default"].factory.createIdentifier('document'), 'createElement');
    return ts__default["default"].factory.createCallExpression(
    /* expression */ createElement, 
    /* typeArguments */ undefined, 
    /* argumentsArray */ [ts__default["default"].factory.createStringLiteral(tagName)]);
}
/**
 * Create a `ts.VariableStatement` which declares a variable without explicit initialization.
 *
 * The initializer `null!` is used to bypass strict variable initialization checks.
 *
 * Unlike with `tsCreateVariable`, the type of the variable is explicitly specified.
 */
function tsDeclareVariable(id, type) {
    // When we create a variable like `var _t1: boolean = null!`, TypeScript actually infers `_t1`
    // to be `never`, instead of a `boolean`. To work around it, we cast the value
    // in the initializer, e.g. `var _t1 = null! as boolean;`.
    addExpressionIdentifier(type, ExpressionIdentifier.VARIABLE_AS_EXPRESSION);
    const initializer = ts__default["default"].factory.createAsExpression(ts__default["default"].factory.createNonNullExpression(ts__default["default"].factory.createNull()), type);
    const decl = ts__default["default"].factory.createVariableDeclaration(
    /* name */ id, 
    /* exclamationToken */ undefined, 
    /* type */ undefined, 
    /* initializer */ initializer);
    return ts__default["default"].factory.createVariableStatement(
    /* modifiers */ undefined, 
    /* declarationList */ [decl]);
}
/**
 * Creates a `ts.TypeQueryNode` for a coerced input.
 *
 * For example: `typeof MatInput.ngAcceptInputType_value`, where MatInput is `typeName` and `value`
 * is the `coercedInputName`.
 *
 * @param typeName The `EntityName` of the Directive where the static coerced input is defined.
 * @param coercedInputName The field name of the coerced input.
 */
function tsCreateTypeQueryForCoercedInput(typeName, coercedInputName) {
    return ts__default["default"].factory.createTypeQueryNode(ts__default["default"].factory.createQualifiedName(typeName, `ngAcceptInputType_${coercedInputName}`));
}
/**
 * Create a `ts.VariableStatement` that initializes a variable with a given expression.
 *
 * Unlike with `tsDeclareVariable`, the type of the variable is inferred from the initializer
 * expression.
 */
function tsCreateVariable(id, initializer, flags = null) {
    const decl = ts__default["default"].factory.createVariableDeclaration(
    /* name */ id, 
    /* exclamationToken */ undefined, 
    /* type */ undefined, 
    /* initializer */ initializer);
    return ts__default["default"].factory.createVariableStatement(
    /* modifiers */ undefined, 
    /* declarationList */ flags === null
        ? [decl]
        : ts__default["default"].factory.createVariableDeclarationList([decl], flags));
}
/**
 * Construct a `ts.CallExpression` that calls a method on a receiver.
 */
function tsCallMethod(receiver, methodName, args = []) {
    const methodAccess = ts__default["default"].factory.createPropertyAccessExpression(receiver, methodName);
    return ts__default["default"].factory.createCallExpression(
    /* expression */ methodAccess, 
    /* typeArguments */ undefined, 
    /* argumentsArray */ args);
}
/**
 * Creates a TypeScript node representing a numeric value.
 */
function tsNumericExpression(value) {
    // As of TypeScript 5.3 negative numbers are represented as `prefixUnaryOperator` and passing a
    // negative number (even as a string) into `createNumericLiteral` will result in an error.
    if (value < 0) {
        const operand = ts__default["default"].factory.createNumericLiteral(Math.abs(value));
        return ts__default["default"].factory.createPrefixUnaryExpression(ts__default["default"].SyntaxKind.MinusToken, operand);
    }
    return ts__default["default"].factory.createNumericLiteral(value);
}

/**
 * See `TypeEmitter` for more information on the emitting process.
 */
class TypeParameterEmitter {
    constructor(typeParameters, reflector) {
        this.typeParameters = typeParameters;
        this.reflector = reflector;
    }
    /**
     * Determines whether the type parameters can be emitted. If this returns true, then a call to
     * `emit` is known to succeed. Vice versa, if false is returned then `emit` should not be
     * called, as it would fail.
     */
    canEmit(canEmitReference) {
        if (this.typeParameters === undefined) {
            return true;
        }
        return this.typeParameters.every((typeParam) => {
            return (this.canEmitType(typeParam.constraint, canEmitReference) &&
                this.canEmitType(typeParam.default, canEmitReference));
        });
    }
    canEmitType(type, canEmitReference) {
        if (type === undefined) {
            return true;
        }
        return canEmitType(type, (typeReference) => {
            const reference = this.resolveTypeReference(typeReference);
            if (reference === null) {
                return false;
            }
            if (reference instanceof Reference) {
                return canEmitReference(reference);
            }
            return true;
        });
    }
    /**
     * Emits the type parameters using the provided emitter function for `Reference`s.
     */
    emit(emitReference) {
        if (this.typeParameters === undefined) {
            return undefined;
        }
        const emitter = new TypeEmitter((type) => this.translateTypeReference(type, emitReference));
        return this.typeParameters.map((typeParam) => {
            const constraint = typeParam.constraint !== undefined ? emitter.emitType(typeParam.constraint) : undefined;
            const defaultType = typeParam.default !== undefined ? emitter.emitType(typeParam.default) : undefined;
            return ts__default["default"].factory.updateTypeParameterDeclaration(typeParam, typeParam.modifiers, typeParam.name, constraint, defaultType);
        });
    }
    resolveTypeReference(type) {
        const target = ts__default["default"].isIdentifier(type.typeName) ? type.typeName : type.typeName.right;
        const declaration = this.reflector.getDeclarationOfIdentifier(target);
        // If no declaration could be resolved or does not have a `ts.Declaration`, the type cannot be
        // resolved.
        if (declaration === null || declaration.node === null) {
            return null;
        }
        // If the declaration corresponds with a local type parameter, the type reference can be used
        // as is.
        if (this.isLocalTypeParameter(declaration.node)) {
            return type;
        }
        let owningModule = null;
        if (typeof declaration.viaModule === 'string') {
            owningModule = {
                specifier: declaration.viaModule,
                resolutionContext: type.getSourceFile().fileName,
            };
        }
        return new Reference(declaration.node, declaration.viaModule === AmbientImport ? AmbientImport : owningModule);
    }
    translateTypeReference(type, emitReference) {
        const reference = this.resolveTypeReference(type);
        if (!(reference instanceof Reference)) {
            return reference;
        }
        const typeNode = emitReference(reference);
        if (typeNode === null) {
            return null;
        }
        if (!ts__default["default"].isTypeReferenceNode(typeNode)) {
            throw new Error(`Expected TypeReferenceNode for emitted reference, got ${ts__default["default"].SyntaxKind[typeNode.kind]}.`);
        }
        return typeNode;
    }
    isLocalTypeParameter(decl) {
        // Checking for local type parameters only occurs during resolution of type parameters, so it is
        // guaranteed that type parameters are present.
        return this.typeParameters.some((param) => param === decl);
    }
}

/**
 * Indicates whether a particular component requires an inline type check block.
 *
 * This is not a boolean state as inlining might only be required to get the best possible
 * type-checking, but the component could theoretically still be checked without it.
 */
var TcbInliningRequirement;
(function (TcbInliningRequirement) {
    /**
     * There is no way to type check this component without inlining.
     */
    TcbInliningRequirement[TcbInliningRequirement["MustInline"] = 0] = "MustInline";
    /**
     * Inlining should be used due to the component's generic bounds, but a non-inlining fallback
     * method can be used if that's not possible.
     */
    TcbInliningRequirement[TcbInliningRequirement["ShouldInlineForGenericBounds"] = 1] = "ShouldInlineForGenericBounds";
    /**
     * There is no requirement for this component's TCB to be inlined.
     */
    TcbInliningRequirement[TcbInliningRequirement["None"] = 2] = "None";
})(TcbInliningRequirement || (TcbInliningRequirement = {}));
function checkIfGenericTypeBoundsCanBeEmitted(node, reflector, env) {
    // Generic type parameters are considered context free if they can be emitted into any context.
    const emitter = new TypeParameterEmitter(node.typeParameters, reflector);
    return emitter.canEmit((ref) => env.canReferenceType(ref));
}

function requiresInlineTypeCtor(node, host, env) {
    // The class requires an inline type constructor if it has generic type bounds that can not be
    // emitted into the provided type-check environment.
    return !checkIfGenericTypeBoundsCanBeEmitted(node, host, env);
}

/**
 * Wraps the node in parenthesis such that inserted span comments become attached to the proper
 * node. This is an alias for `ts.factory.createParenthesizedExpression` with the benefit that it
 * signifies that the inserted parenthesis are for diagnostic purposes, not for correctness of the
 * rendered TCB code.
 *
 * Note that it is important that nodes and its attached comment are not wrapped into parenthesis
 * by default, as it prevents correct translation of e.g. diagnostics produced for incorrect method
 * arguments. Such diagnostics would then be produced for the parenthesised node whereas the
 * positional comment would be located within that node, resulting in a mismatch.
 */
function wrapForDiagnostics(expr) {
    return ts__default["default"].factory.createParenthesizedExpression(expr);
}
/**
 * Wraps the node in parenthesis such that inserted span comments become attached to the proper
 * node. This is an alias for `ts.factory.createParenthesizedExpression` with the benefit that it
 * signifies that the inserted parenthesis are for use by the type checker, not for correctness of
 * the rendered TCB code.
 */
function wrapForTypeChecker(expr) {
    return ts__default["default"].factory.createParenthesizedExpression(expr);
}
/**
 * Adds a synthetic comment to the expression that represents the parse span of the provided node.
 * This comment can later be retrieved as trivia of a node to recover original source locations.
 */
function addParseSpanInfo(node, span) {
    let commentText;
    if (span instanceof checker.AbsoluteSourceSpan) {
        commentText = `${span.start},${span.end}`;
    }
    else {
        commentText = `${span.start.offset},${span.end.offset}`;
    }
    ts__default["default"].addSyntheticTrailingComment(node, ts__default["default"].SyntaxKind.MultiLineCommentTrivia, commentText, 
    /* hasTrailingNewLine */ false);
}

/**
 * Expression that is cast to any. Currently represented as `0 as any`.
 *
 * Historically this expression was using `null as any`, but a newly-added check in TypeScript 5.6
 * (https://devblogs.microsoft.com/typescript/announcing-typescript-5-6-beta/#disallowed-nullish-and-truthy-checks)
 * started flagging it as always being nullish. Other options that were considered:
 * - `NaN as any` or `Infinity as any` - not used, because they don't work if the `noLib` compiler
 *   option is enabled. Also they require more characters.
 * - Some flavor of function call, like `isNan(0) as any` - requires even more characters than the
 *   NaN option and has the same issue with `noLib`.
 */
const ANY_EXPRESSION = ts__default["default"].factory.createAsExpression(ts__default["default"].factory.createNumericLiteral('0'), ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword));
const UNDEFINED = ts__default["default"].factory.createIdentifier('undefined');
const UNARY_OPS = new Map([
    ['+', ts__default["default"].SyntaxKind.PlusToken],
    ['-', ts__default["default"].SyntaxKind.MinusToken],
]);
const BINARY_OPS = new Map([
    ['+', ts__default["default"].SyntaxKind.PlusToken],
    ['-', ts__default["default"].SyntaxKind.MinusToken],
    ['<', ts__default["default"].SyntaxKind.LessThanToken],
    ['>', ts__default["default"].SyntaxKind.GreaterThanToken],
    ['<=', ts__default["default"].SyntaxKind.LessThanEqualsToken],
    ['>=', ts__default["default"].SyntaxKind.GreaterThanEqualsToken],
    ['==', ts__default["default"].SyntaxKind.EqualsEqualsToken],
    ['===', ts__default["default"].SyntaxKind.EqualsEqualsEqualsToken],
    ['*', ts__default["default"].SyntaxKind.AsteriskToken],
    ['/', ts__default["default"].SyntaxKind.SlashToken],
    ['%', ts__default["default"].SyntaxKind.PercentToken],
    ['!=', ts__default["default"].SyntaxKind.ExclamationEqualsToken],
    ['!==', ts__default["default"].SyntaxKind.ExclamationEqualsEqualsToken],
    ['||', ts__default["default"].SyntaxKind.BarBarToken],
    ['&&', ts__default["default"].SyntaxKind.AmpersandAmpersandToken],
    ['&', ts__default["default"].SyntaxKind.AmpersandToken],
    ['|', ts__default["default"].SyntaxKind.BarToken],
    ['??', ts__default["default"].SyntaxKind.QuestionQuestionToken],
]);
/**
 * Convert an `AST` to TypeScript code directly, without going through an intermediate `Expression`
 * AST.
 */
function astToTypescript(ast, maybeResolve, config) {
    const translator = new AstTranslator(maybeResolve, config);
    return translator.translate(ast);
}
class AstTranslator {
    constructor(maybeResolve, config) {
        this.maybeResolve = maybeResolve;
        this.config = config;
    }
    translate(ast) {
        // Skip over an `ASTWithSource` as its `visit` method calls directly into its ast's `visit`,
        // which would prevent any custom resolution through `maybeResolve` for that node.
        if (ast instanceof checker.ASTWithSource) {
            ast = ast.ast;
        }
        // The `EmptyExpr` doesn't have a dedicated method on `AstVisitor`, so it's special cased here.
        if (ast instanceof checker.EmptyExpr) {
            const res = ts__default["default"].factory.createIdentifier('undefined');
            addParseSpanInfo(res, ast.sourceSpan);
            return res;
        }
        // First attempt to let any custom resolution logic provide a translation for the given node.
        const resolved = this.maybeResolve(ast);
        if (resolved !== null) {
            return resolved;
        }
        return ast.visit(this);
    }
    visitUnary(ast) {
        const expr = this.translate(ast.expr);
        const op = UNARY_OPS.get(ast.operator);
        if (op === undefined) {
            throw new Error(`Unsupported Unary.operator: ${ast.operator}`);
        }
        const node = wrapForDiagnostics(ts__default["default"].factory.createPrefixUnaryExpression(op, expr));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitBinary(ast) {
        const lhs = wrapForDiagnostics(this.translate(ast.left));
        const rhs = wrapForDiagnostics(this.translate(ast.right));
        const op = BINARY_OPS.get(ast.operation);
        if (op === undefined) {
            throw new Error(`Unsupported Binary.operation: ${ast.operation}`);
        }
        const node = ts__default["default"].factory.createBinaryExpression(lhs, op, rhs);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitChain(ast) {
        const elements = ast.expressions.map((expr) => this.translate(expr));
        const node = wrapForDiagnostics(ts__default["default"].factory.createCommaListExpression(elements));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitConditional(ast) {
        const condExpr = this.translate(ast.condition);
        const trueExpr = this.translate(ast.trueExp);
        // Wrap `falseExpr` in parens so that the trailing parse span info is not attributed to the
        // whole conditional.
        // In the following example, the last source span comment (5,6) could be seen as the
        // trailing comment for _either_ the whole conditional expression _or_ just the `falseExpr` that
        // is immediately before it:
        // `conditional /*1,2*/ ? trueExpr /*3,4*/ : falseExpr /*5,6*/`
        // This should be instead be `conditional /*1,2*/ ? trueExpr /*3,4*/ : (falseExpr /*5,6*/)`
        const falseExpr = wrapForTypeChecker(this.translate(ast.falseExp));
        const node = ts__default["default"].factory.createParenthesizedExpression(ts__default["default"].factory.createConditionalExpression(condExpr, undefined, trueExpr, undefined, falseExpr));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitImplicitReceiver(ast) {
        throw new Error('Method not implemented.');
    }
    visitThisReceiver(ast) {
        throw new Error('Method not implemented.');
    }
    visitInterpolation(ast) {
        // Build up a chain of binary + operations to simulate the string concatenation of the
        // interpolation's expressions. The chain is started using an actual string literal to ensure
        // the type is inferred as 'string'.
        return ast.expressions.reduce((lhs, ast) => ts__default["default"].factory.createBinaryExpression(lhs, ts__default["default"].SyntaxKind.PlusToken, wrapForTypeChecker(this.translate(ast))), ts__default["default"].factory.createStringLiteral(''));
    }
    visitKeyedRead(ast) {
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const key = this.translate(ast.key);
        const node = ts__default["default"].factory.createElementAccessExpression(receiver, key);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitKeyedWrite(ast) {
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const left = ts__default["default"].factory.createElementAccessExpression(receiver, this.translate(ast.key));
        // TODO(joost): annotate `left` with the span of the element access, which is not currently
        //  available on `ast`.
        const right = wrapForTypeChecker(this.translate(ast.value));
        const node = wrapForDiagnostics(ts__default["default"].factory.createBinaryExpression(left, ts__default["default"].SyntaxKind.EqualsToken, right));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitLiteralArray(ast) {
        const elements = ast.expressions.map((expr) => this.translate(expr));
        const literal = ts__default["default"].factory.createArrayLiteralExpression(elements);
        // If strictLiteralTypes is disabled, array literals are cast to `any`.
        const node = this.config.strictLiteralTypes ? literal : tsCastToAny(literal);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitLiteralMap(ast) {
        const properties = ast.keys.map(({ key }, idx) => {
            const value = this.translate(ast.values[idx]);
            return ts__default["default"].factory.createPropertyAssignment(ts__default["default"].factory.createStringLiteral(key), value);
        });
        const literal = ts__default["default"].factory.createObjectLiteralExpression(properties, true);
        // If strictLiteralTypes is disabled, object literals are cast to `any`.
        const node = this.config.strictLiteralTypes ? literal : tsCastToAny(literal);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitLiteralPrimitive(ast) {
        let node;
        if (ast.value === undefined) {
            node = ts__default["default"].factory.createIdentifier('undefined');
        }
        else if (ast.value === null) {
            node = ts__default["default"].factory.createNull();
        }
        else if (typeof ast.value === 'string') {
            node = ts__default["default"].factory.createStringLiteral(ast.value);
        }
        else if (typeof ast.value === 'number') {
            node = tsNumericExpression(ast.value);
        }
        else if (typeof ast.value === 'boolean') {
            node = ast.value ? ts__default["default"].factory.createTrue() : ts__default["default"].factory.createFalse();
        }
        else {
            throw Error(`Unsupported AST value of type ${typeof ast.value}`);
        }
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitNonNullAssert(ast) {
        const expr = wrapForDiagnostics(this.translate(ast.expression));
        const node = ts__default["default"].factory.createNonNullExpression(expr);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitPipe(ast) {
        throw new Error('Method not implemented.');
    }
    visitPrefixNot(ast) {
        const expression = wrapForDiagnostics(this.translate(ast.expression));
        const node = ts__default["default"].factory.createLogicalNot(expression);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitTypeofExpresion(ast) {
        const expression = wrapForDiagnostics(this.translate(ast.expression));
        const node = ts__default["default"].factory.createTypeOfExpression(expression);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitPropertyRead(ast) {
        // This is a normal property read - convert the receiver to an expression and emit the correct
        // TypeScript expression to read the property.
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const name = ts__default["default"].factory.createPropertyAccessExpression(receiver, ast.name);
        addParseSpanInfo(name, ast.nameSpan);
        const node = wrapForDiagnostics(name);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitPropertyWrite(ast) {
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const left = ts__default["default"].factory.createPropertyAccessExpression(receiver, ast.name);
        addParseSpanInfo(left, ast.nameSpan);
        // TypeScript reports assignment errors on the entire lvalue expression. Annotate the lvalue of
        // the assignment with the sourceSpan, which includes receivers, rather than nameSpan for
        // consistency of the diagnostic location.
        // a.b.c = 1
        // ^^^^^^^^^ sourceSpan
        //     ^     nameSpan
        const leftWithPath = wrapForDiagnostics(left);
        addParseSpanInfo(leftWithPath, ast.sourceSpan);
        // The right needs to be wrapped in parens as well or we cannot accurately match its
        // span to just the RHS. For example, the span in `e = $event /*0,10*/` is ambiguous.
        // It could refer to either the whole binary expression or just the RHS.
        // We should instead generate `e = ($event /*0,10*/)` so we know the span 0,10 matches RHS.
        const right = wrapForTypeChecker(this.translate(ast.value));
        const node = wrapForDiagnostics(ts__default["default"].factory.createBinaryExpression(leftWithPath, ts__default["default"].SyntaxKind.EqualsToken, right));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitSafePropertyRead(ast) {
        let node;
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        // The form of safe property reads depends on whether strictness is in use.
        if (this.config.strictSafeNavigationTypes) {
            // Basically, the return here is either the type of the complete expression with a null-safe
            // property read, or `undefined`. So a ternary is used to create an "or" type:
            // "a?.b" becomes (0 as any ? a!.b : undefined)
            // The type of this expression is (typeof a!.b) | undefined, which is exactly as desired.
            const expr = ts__default["default"].factory.createPropertyAccessExpression(ts__default["default"].factory.createNonNullExpression(receiver), ast.name);
            addParseSpanInfo(expr, ast.nameSpan);
            node = ts__default["default"].factory.createParenthesizedExpression(ts__default["default"].factory.createConditionalExpression(ANY_EXPRESSION, undefined, expr, undefined, UNDEFINED));
        }
        else if (VeSafeLhsInferenceBugDetector.veWillInferAnyFor(ast)) {
            // Emulate a View Engine bug where 'any' is inferred for the left-hand side of the safe
            // navigation operation. With this bug, the type of the left-hand side is regarded as any.
            // Therefore, the left-hand side only needs repeating in the output (to validate it), and then
            // 'any' is used for the rest of the expression. This is done using a comma operator:
            // "a?.b" becomes (a as any).b, which will of course have type 'any'.
            node = ts__default["default"].factory.createPropertyAccessExpression(tsCastToAny(receiver), ast.name);
        }
        else {
            // The View Engine bug isn't active, so check the entire type of the expression, but the final
            // result is still inferred as `any`.
            // "a?.b" becomes (a!.b as any)
            const expr = ts__default["default"].factory.createPropertyAccessExpression(ts__default["default"].factory.createNonNullExpression(receiver), ast.name);
            addParseSpanInfo(expr, ast.nameSpan);
            node = tsCastToAny(expr);
        }
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitSafeKeyedRead(ast) {
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const key = this.translate(ast.key);
        let node;
        // The form of safe property reads depends on whether strictness is in use.
        if (this.config.strictSafeNavigationTypes) {
            // "a?.[...]" becomes (0 as any ? a![...] : undefined)
            const expr = ts__default["default"].factory.createElementAccessExpression(ts__default["default"].factory.createNonNullExpression(receiver), key);
            addParseSpanInfo(expr, ast.sourceSpan);
            node = ts__default["default"].factory.createParenthesizedExpression(ts__default["default"].factory.createConditionalExpression(ANY_EXPRESSION, undefined, expr, undefined, UNDEFINED));
        }
        else if (VeSafeLhsInferenceBugDetector.veWillInferAnyFor(ast)) {
            // "a?.[...]" becomes (a as any)[...]
            node = ts__default["default"].factory.createElementAccessExpression(tsCastToAny(receiver), key);
        }
        else {
            // "a?.[...]" becomes (a!.[...] as any)
            const expr = ts__default["default"].factory.createElementAccessExpression(ts__default["default"].factory.createNonNullExpression(receiver), key);
            addParseSpanInfo(expr, ast.sourceSpan);
            node = tsCastToAny(expr);
        }
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitCall(ast) {
        const args = ast.args.map((expr) => this.translate(expr));
        let expr;
        const receiver = ast.receiver;
        // For calls that have a property read as receiver, we have to special-case their emit to avoid
        // inserting superfluous parenthesis as they prevent TypeScript from applying a narrowing effect
        // if the method acts as a type guard.
        if (receiver instanceof checker.PropertyRead) {
            const resolved = this.maybeResolve(receiver);
            if (resolved !== null) {
                expr = resolved;
            }
            else {
                const propertyReceiver = wrapForDiagnostics(this.translate(receiver.receiver));
                expr = ts__default["default"].factory.createPropertyAccessExpression(propertyReceiver, receiver.name);
                addParseSpanInfo(expr, receiver.nameSpan);
            }
        }
        else {
            expr = this.translate(receiver);
        }
        let node;
        // Safe property/keyed reads will produce a ternary whose value is nullable.
        // We have to generate a similar ternary around the call.
        if (ast.receiver instanceof checker.SafePropertyRead || ast.receiver instanceof checker.SafeKeyedRead) {
            node = this.convertToSafeCall(ast, expr, args);
        }
        else {
            node = ts__default["default"].factory.createCallExpression(expr, undefined, args);
        }
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitSafeCall(ast) {
        const args = ast.args.map((expr) => this.translate(expr));
        const expr = wrapForDiagnostics(this.translate(ast.receiver));
        const node = this.convertToSafeCall(ast, expr, args);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    convertToSafeCall(ast, expr, args) {
        if (this.config.strictSafeNavigationTypes) {
            // "a?.method(...)" becomes (0 as any ? a!.method(...) : undefined)
            const call = ts__default["default"].factory.createCallExpression(ts__default["default"].factory.createNonNullExpression(expr), undefined, args);
            return ts__default["default"].factory.createParenthesizedExpression(ts__default["default"].factory.createConditionalExpression(ANY_EXPRESSION, undefined, call, undefined, UNDEFINED));
        }
        if (VeSafeLhsInferenceBugDetector.veWillInferAnyFor(ast)) {
            // "a?.method(...)" becomes (a as any).method(...)
            return ts__default["default"].factory.createCallExpression(tsCastToAny(expr), undefined, args);
        }
        // "a?.method(...)" becomes (a!.method(...) as any)
        return tsCastToAny(ts__default["default"].factory.createCallExpression(ts__default["default"].factory.createNonNullExpression(expr), undefined, args));
    }
}
/**
 * Checks whether View Engine will infer a type of 'any' for the left-hand side of a safe navigation
 * operation.
 *
 * In View Engine's template type-checker, certain receivers of safe navigation operations will
 * cause a temporary variable to be allocated as part of the checking expression, to save the value
 * of the receiver and use it more than once in the expression. This temporary variable has type
 * 'any'. In practice, this means certain receivers cause View Engine to not check the full
 * expression, and other receivers will receive more complete checking.
 *
 * For compatibility, this logic is adapted from View Engine's expression_converter.ts so that the
 * Ivy checker can emulate this bug when needed.
 */
class VeSafeLhsInferenceBugDetector {
    static { this.SINGLETON = new VeSafeLhsInferenceBugDetector(); }
    static veWillInferAnyFor(ast) {
        const visitor = VeSafeLhsInferenceBugDetector.SINGLETON;
        return ast instanceof checker.Call ? ast.visit(visitor) : ast.receiver.visit(visitor);
    }
    visitUnary(ast) {
        return ast.expr.visit(this);
    }
    visitBinary(ast) {
        return ast.left.visit(this) || ast.right.visit(this);
    }
    visitChain(ast) {
        return false;
    }
    visitConditional(ast) {
        return ast.condition.visit(this) || ast.trueExp.visit(this) || ast.falseExp.visit(this);
    }
    visitCall(ast) {
        return true;
    }
    visitSafeCall(ast) {
        return false;
    }
    visitImplicitReceiver(ast) {
        return false;
    }
    visitThisReceiver(ast) {
        return false;
    }
    visitInterpolation(ast) {
        return ast.expressions.some((exp) => exp.visit(this));
    }
    visitKeyedRead(ast) {
        return false;
    }
    visitKeyedWrite(ast) {
        return false;
    }
    visitLiteralArray(ast) {
        return true;
    }
    visitLiteralMap(ast) {
        return true;
    }
    visitLiteralPrimitive(ast) {
        return false;
    }
    visitPipe(ast) {
        return true;
    }
    visitPrefixNot(ast) {
        return ast.expression.visit(this);
    }
    visitTypeofExpresion(ast) {
        return ast.expression.visit(this);
    }
    visitNonNullAssert(ast) {
        return ast.expression.visit(this);
    }
    visitPropertyRead(ast) {
        return false;
    }
    visitPropertyWrite(ast) {
        return false;
    }
    visitSafePropertyRead(ast) {
        return false;
    }
    visitSafeKeyedRead(ast) {
        return false;
    }
}

/**
 * Controls how generics for the component context class will be handled during TCB generation.
 */
var TcbGenericContextBehavior;
(function (TcbGenericContextBehavior) {
    /**
     * References to generic parameter bounds will be emitted via the `TypeParameterEmitter`.
     *
     * The caller must verify that all parameter bounds are emittable in order to use this mode.
     */
    TcbGenericContextBehavior[TcbGenericContextBehavior["UseEmitter"] = 0] = "UseEmitter";
    /**
     * Generic parameter declarations will be copied directly from the `ts.ClassDeclaration` of the
     * component class.
     *
     * The caller must only use the generated TCB code in a context where such copies will still be
     * valid, such as an inline type check block.
     */
    TcbGenericContextBehavior[TcbGenericContextBehavior["CopyClassNodes"] = 1] = "CopyClassNodes";
    /**
     * Any generic parameters for the component context class will be set to `any`.
     *
     * Produces a less useful type, but is always safe to use.
     */
    TcbGenericContextBehavior[TcbGenericContextBehavior["FallbackToAny"] = 2] = "FallbackToAny";
})(TcbGenericContextBehavior || (TcbGenericContextBehavior = {}));
/**
 * A code generation operation that's involved in the construction of a Type Check Block.
 *
 * The generation of a TCB is non-linear. Bindings within a template may result in the need to
 * construct certain types earlier than they otherwise would be constructed. That is, if the
 * generation of a TCB for a template is broken down into specific operations (constructing a
 * directive, extracting a variable from a let- operation, etc), then it's possible for operations
 * earlier in the sequence to depend on operations which occur later in the sequence.
 *
 * `TcbOp` abstracts the different types of operations which are required to convert a template into
 * a TCB. This allows for two phases of processing for the template, where 1) a linear sequence of
 * `TcbOp`s is generated, and then 2) these operations are executed, not necessarily in linear
 * order.
 *
 * Each `TcbOp` may insert statements into the body of the TCB, and also optionally return a
 * `ts.Expression` which can be used to reference the operation's result.
 */
class TcbOp {
    /**
     * Replacement value or operation used while this `TcbOp` is executing (i.e. to resolve circular
     * references during its execution).
     *
     * This is usually a `null!` expression (which asks TS to infer an appropriate type), but another
     * `TcbOp` can be returned in cases where additional code generation is necessary to deal with
     * circular references.
     */
    circularFallback() {
        return INFER_TYPE_FOR_CIRCULAR_OP_EXPR;
    }
}
/**
 * A `TcbOp` which creates an expression for a native DOM element (or web component) from a
 * `TmplAstElement`.
 *
 * Executing this operation returns a reference to the element variable.
 */
class TcbElementOp extends TcbOp {
    constructor(tcb, scope, element) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.element = element;
    }
    get optional() {
        // The statement generated by this operation is only used for type-inference of the DOM
        // element's type and won't report diagnostics by itself, so the operation is marked as optional
        // to avoid generating statements for DOM elements that are never referenced.
        return true;
    }
    execute() {
        const id = this.tcb.allocateId();
        // Add the declaration of the element using document.createElement.
        const initializer = tsCreateElement(this.element.name);
        addParseSpanInfo(initializer, this.element.startSourceSpan || this.element.sourceSpan);
        this.scope.addStatement(tsCreateVariable(id, initializer));
        return id;
    }
}
/**
 * A `TcbOp` which creates an expression for particular let- `TmplAstVariable` on a
 * `TmplAstTemplate`'s context.
 *
 * Executing this operation returns a reference to the variable variable (lol).
 */
class TcbTemplateVariableOp extends TcbOp {
    constructor(tcb, scope, template, variable) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.template = template;
        this.variable = variable;
    }
    get optional() {
        return false;
    }
    execute() {
        // Look for a context variable for the template.
        const ctx = this.scope.resolve(this.template);
        // Allocate an identifier for the TmplAstVariable, and initialize it to a read of the variable
        // on the template context.
        const id = this.tcb.allocateId();
        const initializer = ts__default["default"].factory.createPropertyAccessExpression(
        /* expression */ ctx, 
        /* name */ this.variable.value || '$implicit');
        addParseSpanInfo(id, this.variable.keySpan);
        // Declare the variable, and return its identifier.
        let variable;
        if (this.variable.valueSpan !== undefined) {
            addParseSpanInfo(initializer, this.variable.valueSpan);
            variable = tsCreateVariable(id, wrapForTypeChecker(initializer));
        }
        else {
            variable = tsCreateVariable(id, initializer);
        }
        addParseSpanInfo(variable.declarationList.declarations[0], this.variable.sourceSpan);
        this.scope.addStatement(variable);
        return id;
    }
}
/**
 * A `TcbOp` which generates a variable for a `TmplAstTemplate`'s context.
 *
 * Executing this operation returns a reference to the template's context variable.
 */
class TcbTemplateContextOp extends TcbOp {
    constructor(tcb, scope) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        // The declaration of the context variable is only needed when the context is actually referenced.
        this.optional = true;
    }
    execute() {
        // Allocate a template ctx variable and declare it with an 'any' type. The type of this variable
        // may be narrowed as a result of template guard conditions.
        const ctx = this.tcb.allocateId();
        const type = ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword);
        this.scope.addStatement(tsDeclareVariable(ctx, type));
        return ctx;
    }
}
/**
 * A `TcbOp` which generates a constant for a `TmplAstLetDeclaration`.
 *
 * Executing this operation returns a reference to the `@let` declaration.
 */
class TcbLetDeclarationOp extends TcbOp {
    constructor(tcb, scope, node) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        /**
         * `@let` declarations are mandatory, because their expressions
         * should be checked even if they aren't referenced anywhere.
         */
        this.optional = false;
    }
    execute() {
        const id = this.tcb.allocateId();
        addParseSpanInfo(id, this.node.nameSpan);
        const value = tcbExpression(this.node.value, this.tcb, this.scope);
        // Value needs to be wrapped, because spans for the expressions inside of it can
        // be picked up incorrectly as belonging to the full variable declaration.
        const varStatement = tsCreateVariable(id, wrapForTypeChecker(value), ts__default["default"].NodeFlags.Const);
        addParseSpanInfo(varStatement.declarationList.declarations[0], this.node.sourceSpan);
        this.scope.addStatement(varStatement);
        return id;
    }
}
/**
 * A `TcbOp` which descends into a `TmplAstTemplate`'s children and generates type-checking code for
 * them.
 *
 * This operation wraps the children's type-checking code in an `if` block, which may include one
 * or more type guard conditions that narrow types within the template body.
 */
class TcbTemplateBodyOp extends TcbOp {
    constructor(tcb, scope, template) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.template = template;
    }
    get optional() {
        return false;
    }
    execute() {
        // An `if` will be constructed, within which the template's children will be type checked. The
        // `if` is used for two reasons: it creates a new syntactic scope, isolating variables declared
        // in the template's TCB from the outer context, and it allows any directives on the templates
        // to perform type narrowing of either expressions or the template's context.
        //
        // The guard is the `if` block's condition. It's usually set to `true` but directives that exist
        // on the template can trigger extra guard expressions that serve to narrow types within the
        // `if`. `guard` is calculated by starting with `true` and adding other conditions as needed.
        // Collect these into `guards` by processing the directives.
        const directiveGuards = [];
        const directives = this.tcb.boundTarget.getDirectivesOfNode(this.template);
        if (directives !== null) {
            for (const dir of directives) {
                const dirInstId = this.scope.resolve(this.template, dir);
                const dirId = this.tcb.env.reference(dir.ref);
                // There are two kinds of guards. Template guards (ngTemplateGuards) allow type narrowing of
                // the expression passed to an @Input of the directive. Scan the directive to see if it has
                // any template guards, and generate them if needed.
                dir.ngTemplateGuards.forEach((guard) => {
                    // For each template guard function on the directive, look for a binding to that input.
                    const boundInput = this.template.inputs.find((i) => i.name === guard.inputName) ||
                        this.template.templateAttrs.find((i) => i instanceof checker.BoundAttribute && i.name === guard.inputName);
                    if (boundInput !== undefined) {
                        // If there is such a binding, generate an expression for it.
                        const expr = tcbExpression(boundInput.value, this.tcb, this.scope);
                        // The expression has already been checked in the type constructor invocation, so
                        // it should be ignored when used within a template guard.
                        markIgnoreDiagnostics(expr);
                        if (guard.type === 'binding') {
                            // Use the binding expression itself as guard.
                            directiveGuards.push(expr);
                        }
                        else {
                            // Call the guard function on the directive with the directive instance and that
                            // expression.
                            const guardInvoke = tsCallMethod(dirId, `ngTemplateGuard_${guard.inputName}`, [
                                dirInstId,
                                expr,
                            ]);
                            addParseSpanInfo(guardInvoke, boundInput.value.sourceSpan);
                            directiveGuards.push(guardInvoke);
                        }
                    }
                });
                // The second kind of guard is a template context guard. This guard narrows the template
                // rendering context variable `ctx`.
                if (dir.hasNgTemplateContextGuard) {
                    if (this.tcb.env.config.applyTemplateContextGuards) {
                        const ctx = this.scope.resolve(this.template);
                        const guardInvoke = tsCallMethod(dirId, 'ngTemplateContextGuard', [dirInstId, ctx]);
                        addParseSpanInfo(guardInvoke, this.template.sourceSpan);
                        directiveGuards.push(guardInvoke);
                    }
                    else if (this.template.variables.length > 0 &&
                        this.tcb.env.config.suggestionsForSuboptimalTypeInference) {
                        // The compiler could have inferred a better type for the variables in this template,
                        // but was prevented from doing so by the type-checking configuration. Issue a warning
                        // diagnostic.
                        this.tcb.oobRecorder.suboptimalTypeInference(this.tcb.id, this.template.variables);
                    }
                }
            }
        }
        // By default the guard is simply `true`.
        let guard = null;
        // If there are any guards from directives, use them instead.
        if (directiveGuards.length > 0) {
            // Pop the first value and use it as the initializer to reduce(). This way, a single guard
            // will be used on its own, but two or more will be combined into binary AND expressions.
            guard = directiveGuards.reduce((expr, dirGuard) => ts__default["default"].factory.createBinaryExpression(expr, ts__default["default"].SyntaxKind.AmpersandAmpersandToken, dirGuard), directiveGuards.pop());
        }
        // Create a new Scope for the template. This constructs the list of operations for the template
        // children, as well as tracks bindings within the template.
        const tmplScope = Scope.forNodes(this.tcb, this.scope, this.template, this.template.children, guard);
        // Render the template's `Scope` into its statements.
        const statements = tmplScope.render();
        if (statements.length === 0) {
            // As an optimization, don't generate the scope's block if it has no statements. This is
            // beneficial for templates that contain for example `<span *ngIf="first"></span>`, in which
            // case there's no need to render the `NgIf` guard expression. This seems like a minor
            // improvement, however it reduces the number of flow-node antecedents that TypeScript needs
            // to keep into account for such cases, resulting in an overall reduction of
            // type-checking time.
            return null;
        }
        let tmplBlock = ts__default["default"].factory.createBlock(statements);
        if (guard !== null) {
            // The scope has a guard that needs to be applied, so wrap the template block into an `if`
            // statement containing the guard expression.
            tmplBlock = ts__default["default"].factory.createIfStatement(
            /* expression */ guard, 
            /* thenStatement */ tmplBlock);
        }
        this.scope.addStatement(tmplBlock);
        return null;
    }
}
/**
 * A `TcbOp` which renders an Angular expression (e.g. `{{foo() && bar.baz}}`).
 *
 * Executing this operation returns nothing.
 */
class TcbExpressionOp extends TcbOp {
    constructor(tcb, scope, expression) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.expression = expression;
    }
    get optional() {
        return false;
    }
    execute() {
        const expr = tcbExpression(this.expression, this.tcb, this.scope);
        this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(expr));
        return null;
    }
}
/**
 * A `TcbOp` which constructs an instance of a directive. For generic directives, generic
 * parameters are set to `any` type.
 */
class TcbDirectiveTypeOpBase extends TcbOp {
    constructor(tcb, scope, node, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.dir = dir;
    }
    get optional() {
        // The statement generated by this operation is only used to declare the directive's type and
        // won't report diagnostics by itself, so the operation is marked as optional to avoid
        // generating declarations for directives that don't have any inputs/outputs.
        return true;
    }
    execute() {
        const dirRef = this.dir.ref;
        const rawType = this.tcb.env.referenceType(this.dir.ref);
        let type;
        if (this.dir.isGeneric === false || dirRef.node.typeParameters === undefined) {
            type = rawType;
        }
        else {
            if (!ts__default["default"].isTypeReferenceNode(rawType)) {
                throw new Error(`Expected TypeReferenceNode when referencing the type for ${this.dir.ref.debugName}`);
            }
            const typeArguments = dirRef.node.typeParameters.map(() => ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword));
            type = ts__default["default"].factory.createTypeReferenceNode(rawType.typeName, typeArguments);
        }
        const id = this.tcb.allocateId();
        addExpressionIdentifier(id, ExpressionIdentifier.DIRECTIVE);
        addParseSpanInfo(id, this.node.startSourceSpan || this.node.sourceSpan);
        this.scope.addStatement(tsDeclareVariable(id, type));
        return id;
    }
}
/**
 * A `TcbOp` which constructs an instance of a non-generic directive _without_ setting any of its
 * inputs. Inputs are later set in the `TcbDirectiveInputsOp`. Type checking was found to be
 * faster when done in this way as opposed to `TcbDirectiveCtorOp` which is only necessary when the
 * directive is generic.
 *
 * Executing this operation returns a reference to the directive instance variable with its inferred
 * type.
 */
class TcbNonGenericDirectiveTypeOp extends TcbDirectiveTypeOpBase {
    /**
     * Creates a variable declaration for this op's directive of the argument type. Returns the id of
     * the newly created variable.
     */
    execute() {
        const dirRef = this.dir.ref;
        if (this.dir.isGeneric) {
            throw new Error(`Assertion Error: expected ${dirRef.debugName} not to be generic.`);
        }
        return super.execute();
    }
}
/**
 * A `TcbOp` which constructs an instance of a generic directive with its generic parameters set
 * to `any` type. This op is like `TcbDirectiveTypeOp`, except that generic parameters are set to
 * `any` type. This is used for situations where we want to avoid inlining.
 *
 * Executing this operation returns a reference to the directive instance variable with its generic
 * type parameters set to `any`.
 */
class TcbGenericDirectiveTypeWithAnyParamsOp extends TcbDirectiveTypeOpBase {
    execute() {
        const dirRef = this.dir.ref;
        if (dirRef.node.typeParameters === undefined) {
            throw new Error(`Assertion Error: expected typeParameters when creating a declaration for ${dirRef.debugName}`);
        }
        return super.execute();
    }
}
/**
 * A `TcbOp` which creates a variable for a local ref in a template.
 * The initializer for the variable is the variable expression for the directive, template, or
 * element the ref refers to. When the reference is used in the template, those TCB statements will
 * access this variable as well. For example:
 * ```
 * var _t1 = document.createElement('div');
 * var _t2 = _t1;
 * _t2.value
 * ```
 * This operation supports more fluent lookups for the `TemplateTypeChecker` when getting a symbol
 * for a reference. In most cases, this isn't essential; that is, the information for the symbol
 * could be gathered without this operation using the `BoundTarget`. However, for the case of
 * ng-template references, we will need this reference variable to not only provide a location in
 * the shim file, but also to narrow the variable to the correct `TemplateRef<T>` type rather than
 * `TemplateRef<any>` (this work is still TODO).
 *
 * Executing this operation returns a reference to the directive instance variable with its inferred
 * type.
 */
class TcbReferenceOp extends TcbOp {
    constructor(tcb, scope, node, host, target) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.host = host;
        this.target = target;
        // The statement generated by this operation is only used to for the Type Checker
        // so it can map a reference variable in the template directly to a node in the TCB.
        this.optional = true;
    }
    execute() {
        const id = this.tcb.allocateId();
        let initializer = this.target instanceof checker.Template || this.target instanceof checker.Element$1
            ? this.scope.resolve(this.target)
            : this.scope.resolve(this.host, this.target);
        // The reference is either to an element, an <ng-template> node, or to a directive on an
        // element or template.
        if ((this.target instanceof checker.Element$1 && !this.tcb.env.config.checkTypeOfDomReferences) ||
            !this.tcb.env.config.checkTypeOfNonDomReferences) {
            // References to DOM nodes are pinned to 'any' when `checkTypeOfDomReferences` is `false`.
            // References to `TemplateRef`s and directives are pinned to 'any' when
            // `checkTypeOfNonDomReferences` is `false`.
            initializer = ts__default["default"].factory.createAsExpression(initializer, ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword));
        }
        else if (this.target instanceof checker.Template) {
            // Direct references to an <ng-template> node simply require a value of type
            // `TemplateRef<any>`. To get this, an expression of the form
            // `(_t1 as any as TemplateRef<any>)` is constructed.
            initializer = ts__default["default"].factory.createAsExpression(initializer, ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword));
            initializer = ts__default["default"].factory.createAsExpression(initializer, this.tcb.env.referenceExternalType('@angular/core', 'TemplateRef', [checker.DYNAMIC_TYPE]));
            initializer = ts__default["default"].factory.createParenthesizedExpression(initializer);
        }
        addParseSpanInfo(initializer, this.node.sourceSpan);
        addParseSpanInfo(id, this.node.keySpan);
        this.scope.addStatement(tsCreateVariable(id, initializer));
        return id;
    }
}
/**
 * A `TcbOp` which is used when the target of a reference is missing. This operation generates a
 * variable of type any for usages of the invalid reference to resolve to. The invalid reference
 * itself is recorded out-of-band.
 */
class TcbInvalidReferenceOp extends TcbOp {
    constructor(tcb, scope) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        // The declaration of a missing reference is only needed when the reference is resolved.
        this.optional = true;
    }
    execute() {
        const id = this.tcb.allocateId();
        this.scope.addStatement(tsCreateVariable(id, ANY_EXPRESSION));
        return id;
    }
}
/**
 * A `TcbOp` which constructs an instance of a directive with types inferred from its inputs. The
 * inputs themselves are not checked here; checking of inputs is achieved in `TcbDirectiveInputsOp`.
 * Any errors reported in this statement are ignored, as the type constructor call is only present
 * for type-inference.
 *
 * When a Directive is generic, it is required that the TCB generates the instance using this method
 * in order to infer the type information correctly.
 *
 * Executing this operation returns a reference to the directive instance variable with its inferred
 * type.
 */
class TcbDirectiveCtorOp extends TcbOp {
    constructor(tcb, scope, node, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.dir = dir;
    }
    get optional() {
        // The statement generated by this operation is only used to infer the directive's type and
        // won't report diagnostics by itself, so the operation is marked as optional.
        return true;
    }
    execute() {
        const id = this.tcb.allocateId();
        addExpressionIdentifier(id, ExpressionIdentifier.DIRECTIVE);
        addParseSpanInfo(id, this.node.startSourceSpan || this.node.sourceSpan);
        const genericInputs = new Map();
        const boundAttrs = getBoundAttributes(this.dir, this.node);
        for (const attr of boundAttrs) {
            // Skip text attributes if configured to do so.
            if (!this.tcb.env.config.checkTypeOfAttributes &&
                attr.attribute instanceof checker.TextAttribute) {
                continue;
            }
            for (const { fieldName, isTwoWayBinding } of attr.inputs) {
                // Skip the field if an attribute has already been bound to it; we can't have a duplicate
                // key in the type constructor call.
                if (genericInputs.has(fieldName)) {
                    continue;
                }
                const expression = translateInput(attr.attribute, this.tcb, this.scope);
                genericInputs.set(fieldName, {
                    type: 'binding',
                    field: fieldName,
                    expression,
                    sourceSpan: attr.attribute.sourceSpan,
                    isTwoWayBinding,
                });
            }
        }
        // Add unset directive inputs for each of the remaining unset fields.
        for (const { classPropertyName } of this.dir.inputs) {
            if (!genericInputs.has(classPropertyName)) {
                genericInputs.set(classPropertyName, { type: 'unset', field: classPropertyName });
            }
        }
        // Call the type constructor of the directive to infer a type, and assign the directive
        // instance.
        const typeCtor = tcbCallTypeCtor(this.dir, this.tcb, Array.from(genericInputs.values()));
        markIgnoreDiagnostics(typeCtor);
        this.scope.addStatement(tsCreateVariable(id, typeCtor));
        return id;
    }
    circularFallback() {
        return new TcbDirectiveCtorCircularFallbackOp(this.tcb, this.scope, this.node, this.dir);
    }
}
/**
 * A `TcbOp` which generates code to check input bindings on an element that correspond with the
 * members of a directive.
 *
 * Executing this operation returns nothing.
 */
class TcbDirectiveInputsOp extends TcbOp {
    constructor(tcb, scope, node, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.dir = dir;
    }
    get optional() {
        return false;
    }
    execute() {
        let dirId = null;
        // TODO(joost): report duplicate properties
        const boundAttrs = getBoundAttributes(this.dir, this.node);
        const seenRequiredInputs = new Set();
        for (const attr of boundAttrs) {
            // For bound inputs, the property is assigned the binding expression.
            const expr = widenBinding(translateInput(attr.attribute, this.tcb, this.scope), this.tcb);
            let assignment = wrapForDiagnostics(expr);
            for (const { fieldName, required, transformType, isSignal, isTwoWayBinding } of attr.inputs) {
                let target;
                if (required) {
                    seenRequiredInputs.add(fieldName);
                }
                // Note: There is no special logic for transforms/coercion with signal inputs.
                // For signal inputs, a `transformType` will never be set as we do not capture
                // the transform in the compiler metadata. Signal inputs incorporate their
                // transform write type into their member type, and we extract it below when
                // setting the `WriteT` of such `InputSignalWithTransform<_, WriteT>`.
                if (this.dir.coercedInputFields.has(fieldName)) {
                    let type;
                    if (transformType !== null) {
                        type = this.tcb.env.referenceTransplantedType(new checker.TransplantedType(transformType));
                    }
                    else {
                        // The input has a coercion declaration which should be used instead of assigning the
                        // expression into the input field directly. To achieve this, a variable is declared
                        // with a type of `typeof Directive.ngAcceptInputType_fieldName` which is then used as
                        // target of the assignment.
                        const dirTypeRef = this.tcb.env.referenceType(this.dir.ref);
                        if (!ts__default["default"].isTypeReferenceNode(dirTypeRef)) {
                            throw new Error(`Expected TypeReferenceNode from reference to ${this.dir.ref.debugName}`);
                        }
                        type = tsCreateTypeQueryForCoercedInput(dirTypeRef.typeName, fieldName);
                    }
                    const id = this.tcb.allocateId();
                    this.scope.addStatement(tsDeclareVariable(id, type));
                    target = id;
                }
                else if (this.dir.undeclaredInputFields.has(fieldName)) {
                    // If no coercion declaration is present nor is the field declared (i.e. the input is
                    // declared in a `@Directive` or `@Component` decorator's `inputs` property) there is no
                    // assignment target available, so this field is skipped.
                    continue;
                }
                else if (!this.tcb.env.config.honorAccessModifiersForInputBindings &&
                    this.dir.restrictedInputFields.has(fieldName)) {
                    // If strict checking of access modifiers is disabled and the field is restricted
                    // (i.e. private/protected/readonly), generate an assignment into a temporary variable
                    // that has the type of the field. This achieves type-checking but circumvents the access
                    // modifiers.
                    if (dirId === null) {
                        dirId = this.scope.resolve(this.node, this.dir);
                    }
                    const id = this.tcb.allocateId();
                    const dirTypeRef = this.tcb.env.referenceType(this.dir.ref);
                    if (!ts__default["default"].isTypeReferenceNode(dirTypeRef)) {
                        throw new Error(`Expected TypeReferenceNode from reference to ${this.dir.ref.debugName}`);
                    }
                    const type = ts__default["default"].factory.createIndexedAccessTypeNode(ts__default["default"].factory.createTypeQueryNode(dirId), ts__default["default"].factory.createLiteralTypeNode(ts__default["default"].factory.createStringLiteral(fieldName)));
                    const temp = tsDeclareVariable(id, type);
                    this.scope.addStatement(temp);
                    target = id;
                }
                else {
                    if (dirId === null) {
                        dirId = this.scope.resolve(this.node, this.dir);
                    }
                    // To get errors assign directly to the fields on the instance, using property access
                    // when possible. String literal fields may not be valid JS identifiers so we use
                    // literal element access instead for those cases.
                    target = this.dir.stringLiteralInputFields.has(fieldName)
                        ? ts__default["default"].factory.createElementAccessExpression(dirId, ts__default["default"].factory.createStringLiteral(fieldName))
                        : ts__default["default"].factory.createPropertyAccessExpression(dirId, ts__default["default"].factory.createIdentifier(fieldName));
                }
                // For signal inputs, we unwrap the target `InputSignal`. Note that
                // we intentionally do the following things:
                //   1. keep the direct access to `dir.[field]` so that modifiers are honored.
                //   2. follow the existing pattern where multiple targets assign a single expression.
                //      This is a significant requirement for language service auto-completion.
                if (isSignal) {
                    const inputSignalBrandWriteSymbol = this.tcb.env.referenceExternalSymbol(checker.Identifiers.InputSignalBrandWriteType.moduleName, checker.Identifiers.InputSignalBrandWriteType.name);
                    if (!ts__default["default"].isIdentifier(inputSignalBrandWriteSymbol) &&
                        !ts__default["default"].isPropertyAccessExpression(inputSignalBrandWriteSymbol)) {
                        throw new Error(`Expected identifier or property access for reference to ${checker.Identifiers.InputSignalBrandWriteType.name}`);
                    }
                    target = ts__default["default"].factory.createElementAccessExpression(target, inputSignalBrandWriteSymbol);
                }
                if (attr.attribute.keySpan !== undefined) {
                    addParseSpanInfo(target, attr.attribute.keySpan);
                }
                // Two-way bindings accept `T | WritableSignal<T>` so we have to unwrap the value.
                if (isTwoWayBinding && this.tcb.env.config.allowSignalsInTwoWayBindings) {
                    assignment = unwrapWritableSignal(assignment, this.tcb);
                }
                // Finally the assignment is extended by assigning it into the target expression.
                assignment = ts__default["default"].factory.createBinaryExpression(target, ts__default["default"].SyntaxKind.EqualsToken, assignment);
            }
            addParseSpanInfo(assignment, attr.attribute.sourceSpan);
            // Ignore diagnostics for text attributes if configured to do so.
            if (!this.tcb.env.config.checkTypeOfAttributes &&
                attr.attribute instanceof checker.TextAttribute) {
                markIgnoreDiagnostics(assignment);
            }
            this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(assignment));
        }
        this.checkRequiredInputs(seenRequiredInputs);
        return null;
    }
    checkRequiredInputs(seenRequiredInputs) {
        const missing = [];
        for (const input of this.dir.inputs) {
            if (input.required && !seenRequiredInputs.has(input.classPropertyName)) {
                missing.push(input.bindingPropertyName);
            }
        }
        if (missing.length > 0) {
            this.tcb.oobRecorder.missingRequiredInputs(this.tcb.id, this.node, this.dir.name, this.dir.isComponent, missing);
        }
    }
}
/**
 * A `TcbOp` which is used to generate a fallback expression if the inference of a directive type
 * via `TcbDirectiveCtorOp` requires a reference to its own type. This can happen using a template
 * reference:
 *
 * ```html
 * <some-cmp #ref [prop]="ref.foo"></some-cmp>
 * ```
 *
 * In this case, `TcbDirectiveCtorCircularFallbackOp` will add a second inference of the directive
 * type to the type-check block, this time calling the directive's type constructor without any
 * input expressions. This infers the widest possible supertype for the directive, which is used to
 * resolve any recursive references required to infer the real type.
 */
class TcbDirectiveCtorCircularFallbackOp extends TcbOp {
    constructor(tcb, scope, node, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.dir = dir;
    }
    get optional() {
        return false;
    }
    execute() {
        const id = this.tcb.allocateId();
        const typeCtor = this.tcb.env.typeCtorFor(this.dir);
        const circularPlaceholder = ts__default["default"].factory.createCallExpression(typeCtor, 
        /* typeArguments */ undefined, [ts__default["default"].factory.createNonNullExpression(ts__default["default"].factory.createNull())]);
        this.scope.addStatement(tsCreateVariable(id, circularPlaceholder));
        return id;
    }
}
/**
 * A `TcbOp` which feeds elements and unclaimed properties to the `DomSchemaChecker`.
 *
 * The DOM schema is not checked via TCB code generation. Instead, the `DomSchemaChecker` ingests
 * elements and property bindings and accumulates synthetic `ts.Diagnostic`s out-of-band. These are
 * later merged with the diagnostics generated from the TCB.
 *
 * For convenience, the TCB iteration of the template is used to drive the `DomSchemaChecker` via
 * the `TcbDomSchemaCheckerOp`.
 */
class TcbDomSchemaCheckerOp extends TcbOp {
    constructor(tcb, element, checkElement, claimedInputs) {
        super();
        this.tcb = tcb;
        this.element = element;
        this.checkElement = checkElement;
        this.claimedInputs = claimedInputs;
    }
    get optional() {
        return false;
    }
    execute() {
        if (this.checkElement) {
            this.tcb.domSchemaChecker.checkElement(this.tcb.id, this.element, this.tcb.schemas, this.tcb.hostIsStandalone);
        }
        // TODO(alxhub): this could be more efficient.
        for (const binding of this.element.inputs) {
            const isPropertyBinding = binding.type === checker.BindingType.Property || binding.type === checker.BindingType.TwoWay;
            if (isPropertyBinding && this.claimedInputs.has(binding.name)) {
                // Skip this binding as it was claimed by a directive.
                continue;
            }
            if (isPropertyBinding && binding.name !== 'style' && binding.name !== 'class') {
                // A direct binding to a property.
                const propertyName = ATTR_TO_PROP.get(binding.name) ?? binding.name;
                this.tcb.domSchemaChecker.checkProperty(this.tcb.id, this.element, propertyName, binding.sourceSpan, this.tcb.schemas, this.tcb.hostIsStandalone);
            }
        }
        return null;
    }
}
/**
 * A `TcbOp` that finds and flags control flow nodes that interfere with content projection.
 *
 * Context:
 * Control flow blocks try to emulate the content projection behavior of `*ngIf` and `*ngFor`
 * in order to reduce breakages when moving from one syntax to the other (see #52414), however the
 * approach only works if there's only one element at the root of the control flow expression.
 * This means that a stray sibling node (e.g. text) can prevent an element from being projected
 * into the right slot. The purpose of the `TcbOp` is to find any places where a node at the root
 * of a control flow expression *would have been projected* into a specific slot, if the control
 * flow node didn't exist.
 */
class TcbControlFlowContentProjectionOp extends TcbOp {
    constructor(tcb, element, ngContentSelectors, componentName) {
        super();
        this.tcb = tcb;
        this.element = element;
        this.ngContentSelectors = ngContentSelectors;
        this.componentName = componentName;
        this.optional = false;
        // We only need to account for `error` and `warning` since
        // this check won't be enabled for `suppress`.
        this.category =
            tcb.env.config.controlFlowPreventingContentProjection === 'error'
                ? ts__default["default"].DiagnosticCategory.Error
                : ts__default["default"].DiagnosticCategory.Warning;
    }
    execute() {
        const controlFlowToCheck = this.findPotentialControlFlowNodes();
        if (controlFlowToCheck.length > 0) {
            const matcher = new checker.SelectorMatcher();
            for (const selector of this.ngContentSelectors) {
                // `*` is a special selector for the catch-all slot.
                if (selector !== '*') {
                    matcher.addSelectables(checker.CssSelector.parse(selector), selector);
                }
            }
            for (const root of controlFlowToCheck) {
                for (const child of root.children) {
                    if (child instanceof checker.Element$1 || child instanceof checker.Template) {
                        matcher.match(checker.createCssSelectorFromNode(child), (_, originalSelector) => {
                            this.tcb.oobRecorder.controlFlowPreventingContentProjection(this.tcb.id, this.category, child, this.componentName, originalSelector, root, this.tcb.hostPreserveWhitespaces);
                        });
                    }
                }
            }
        }
        return null;
    }
    findPotentialControlFlowNodes() {
        const result = [];
        for (const child of this.element.children) {
            if (child instanceof checker.ForLoopBlock) {
                if (this.shouldCheck(child)) {
                    result.push(child);
                }
                if (child.empty !== null && this.shouldCheck(child.empty)) {
                    result.push(child.empty);
                }
            }
            else if (child instanceof checker.IfBlock) {
                for (const branch of child.branches) {
                    if (this.shouldCheck(branch)) {
                        result.push(branch);
                    }
                }
            }
            else if (child instanceof checker.SwitchBlock) {
                for (const current of child.cases) {
                    if (this.shouldCheck(current)) {
                        result.push(current);
                    }
                }
            }
        }
        return result;
    }
    shouldCheck(node) {
        // Skip nodes with less than two children since it's impossible
        // for them to run into the issue that we're checking for.
        if (node.children.length < 2) {
            return false;
        }
        let hasSeenRootNode = false;
        // Check the number of root nodes while skipping empty text where relevant.
        for (const child of node.children) {
            // Normally `preserveWhitspaces` would have been accounted for during parsing, however
            // in `ngtsc/annotations/component/src/resources.ts#parseExtractedTemplate` we enable
            // `preserveWhitespaces` to preserve the accuracy of source maps diagnostics. This means
            // that we have to account for it here since the presence of text nodes affects the
            // content projection behavior.
            if (!(child instanceof checker.Text$3) ||
                this.tcb.hostPreserveWhitespaces ||
                child.value.trim().length > 0) {
                // Content projection will be affected if there's more than one root node.
                if (hasSeenRootNode) {
                    return true;
                }
                hasSeenRootNode = true;
            }
        }
        return false;
    }
}
/**
 * Mapping between attributes names that don't correspond to their element property names.
 * Note: this mapping has to be kept in sync with the equally named mapping in the runtime.
 */
const ATTR_TO_PROP = new Map(Object.entries({
    'class': 'className',
    'for': 'htmlFor',
    'formaction': 'formAction',
    'innerHtml': 'innerHTML',
    'readonly': 'readOnly',
    'tabindex': 'tabIndex',
}));
/**
 * A `TcbOp` which generates code to check "unclaimed inputs" - bindings on an element which were
 * not attributed to any directive or component, and are instead processed against the HTML element
 * itself.
 *
 * Currently, only the expressions of these bindings are checked. The targets of the bindings are
 * checked against the DOM schema via a `TcbDomSchemaCheckerOp`.
 *
 * Executing this operation returns nothing.
 */
class TcbUnclaimedInputsOp extends TcbOp {
    constructor(tcb, scope, element, claimedInputs) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.element = element;
        this.claimedInputs = claimedInputs;
    }
    get optional() {
        return false;
    }
    execute() {
        // `this.inputs` contains only those bindings not matched by any directive. These bindings go to
        // the element itself.
        let elId = null;
        // TODO(alxhub): this could be more efficient.
        for (const binding of this.element.inputs) {
            const isPropertyBinding = binding.type === checker.BindingType.Property || binding.type === checker.BindingType.TwoWay;
            if (isPropertyBinding && this.claimedInputs.has(binding.name)) {
                // Skip this binding as it was claimed by a directive.
                continue;
            }
            const expr = widenBinding(tcbExpression(binding.value, this.tcb, this.scope), this.tcb);
            if (this.tcb.env.config.checkTypeOfDomBindings && isPropertyBinding) {
                if (binding.name !== 'style' && binding.name !== 'class') {
                    if (elId === null) {
                        elId = this.scope.resolve(this.element);
                    }
                    // A direct binding to a property.
                    const propertyName = ATTR_TO_PROP.get(binding.name) ?? binding.name;
                    const prop = ts__default["default"].factory.createElementAccessExpression(elId, ts__default["default"].factory.createStringLiteral(propertyName));
                    const stmt = ts__default["default"].factory.createBinaryExpression(prop, ts__default["default"].SyntaxKind.EqualsToken, wrapForDiagnostics(expr));
                    addParseSpanInfo(stmt, binding.sourceSpan);
                    this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(stmt));
                }
                else {
                    this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(expr));
                }
            }
            else {
                // A binding to an animation, attribute, class or style. For now, only validate the right-
                // hand side of the expression.
                // TODO: properly check class and style bindings.
                this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(expr));
            }
        }
        return null;
    }
}
/**
 * A `TcbOp` which generates code to check event bindings on an element that correspond with the
 * outputs of a directive.
 *
 * Executing this operation returns nothing.
 */
class TcbDirectiveOutputsOp extends TcbOp {
    constructor(tcb, scope, node, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.dir = dir;
    }
    get optional() {
        return false;
    }
    execute() {
        let dirId = null;
        const outputs = this.dir.outputs;
        for (const output of this.node.outputs) {
            if (output.type === checker.ParsedEventType.Animation ||
                !outputs.hasBindingPropertyName(output.name)) {
                continue;
            }
            if (this.tcb.env.config.checkTypeOfOutputEvents && output.name.endsWith('Change')) {
                const inputName = output.name.slice(0, -6);
                isSplitTwoWayBinding(inputName, output, this.node.inputs, this.tcb);
            }
            // TODO(alxhub): consider supporting multiple fields with the same property name for outputs.
            const field = outputs.getByBindingPropertyName(output.name)[0].classPropertyName;
            if (dirId === null) {
                dirId = this.scope.resolve(this.node, this.dir);
            }
            const outputField = ts__default["default"].factory.createElementAccessExpression(dirId, ts__default["default"].factory.createStringLiteral(field));
            addParseSpanInfo(outputField, output.keySpan);
            if (this.tcb.env.config.checkTypeOfOutputEvents) {
                // For strict checking of directive events, generate a call to the `subscribe` method
                // on the directive's output field to let type information flow into the handler function's
                // `$event` parameter.
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, 0 /* EventParamType.Infer */);
                const subscribeFn = ts__default["default"].factory.createPropertyAccessExpression(outputField, 'subscribe');
                const call = ts__default["default"].factory.createCallExpression(subscribeFn, /* typeArguments */ undefined, [
                    handler,
                ]);
                addParseSpanInfo(call, output.sourceSpan);
                this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(call));
            }
            else {
                // If strict checking of directive events is disabled:
                //
                // * We still generate the access to the output field as a statement in the TCB so consumers
                //   of the `TemplateTypeChecker` can still find the node for the class member for the
                //   output.
                // * Emit a handler function where the `$event` parameter has an explicit `any` type.
                this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(outputField));
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, 1 /* EventParamType.Any */);
                this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(handler));
            }
        }
        return null;
    }
}
/**
 * A `TcbOp` which generates code to check "unclaimed outputs" - event bindings on an element which
 * were not attributed to any directive or component, and are instead processed against the HTML
 * element itself.
 *
 * Executing this operation returns nothing.
 */
class TcbUnclaimedOutputsOp extends TcbOp {
    constructor(tcb, scope, element, claimedOutputs) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.element = element;
        this.claimedOutputs = claimedOutputs;
    }
    get optional() {
        return false;
    }
    execute() {
        let elId = null;
        // TODO(alxhub): this could be more efficient.
        for (const output of this.element.outputs) {
            if (this.claimedOutputs.has(output.name)) {
                // Skip this event handler as it was claimed by a directive.
                continue;
            }
            if (this.tcb.env.config.checkTypeOfOutputEvents && output.name.endsWith('Change')) {
                const inputName = output.name.slice(0, -6);
                if (isSplitTwoWayBinding(inputName, output, this.element.inputs, this.tcb)) {
                    // Skip this event handler as the error was already handled.
                    continue;
                }
            }
            if (output.type === checker.ParsedEventType.Animation) {
                // Animation output bindings always have an `$event` parameter of type `AnimationEvent`.
                const eventType = this.tcb.env.config.checkTypeOfAnimationEvents
                    ? this.tcb.env.referenceExternalType('@angular/animations', 'AnimationEvent')
                    : 1 /* EventParamType.Any */;
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, eventType);
                this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(handler));
            }
            else if (this.tcb.env.config.checkTypeOfDomEvents) {
                // If strict checking of DOM events is enabled, generate a call to `addEventListener` on
                // the element instance so that TypeScript's type inference for
                // `HTMLElement.addEventListener` using `HTMLElementEventMap` to infer an accurate type for
                // `$event` depending on the event name. For unknown event names, TypeScript resorts to the
                // base `Event` type.
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, 0 /* EventParamType.Infer */);
                if (elId === null) {
                    elId = this.scope.resolve(this.element);
                }
                const propertyAccess = ts__default["default"].factory.createPropertyAccessExpression(elId, 'addEventListener');
                addParseSpanInfo(propertyAccess, output.keySpan);
                const call = ts__default["default"].factory.createCallExpression(
                /* expression */ propertyAccess, 
                /* typeArguments */ undefined, 
                /* arguments */ [ts__default["default"].factory.createStringLiteral(output.name), handler]);
                addParseSpanInfo(call, output.sourceSpan);
                this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(call));
            }
            else {
                // If strict checking of DOM inputs is disabled, emit a handler function where the `$event`
                // parameter has an explicit `any` type.
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, 1 /* EventParamType.Any */);
                this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(handler));
            }
        }
        return null;
    }
}
/**
 * A `TcbOp` which generates a completion point for the component context.
 *
 * This completion point looks like `this. ;` in the TCB output, and does not produce diagnostics.
 * TypeScript autocompletion APIs can be used at this completion point (after the '.') to produce
 * autocompletion results of properties and methods from the template's component context.
 */
class TcbComponentContextCompletionOp extends TcbOp {
    constructor(scope) {
        super();
        this.scope = scope;
        this.optional = false;
    }
    execute() {
        const ctx = ts__default["default"].factory.createThis();
        const ctxDot = ts__default["default"].factory.createPropertyAccessExpression(ctx, '');
        markIgnoreDiagnostics(ctxDot);
        addExpressionIdentifier(ctxDot, ExpressionIdentifier.COMPONENT_COMPLETION);
        this.scope.addStatement(ts__default["default"].factory.createExpressionStatement(ctxDot));
        return null;
    }
}
/**
 * A `TcbOp` which renders a variable defined inside of block syntax (e.g. `@if (expr; as var) {}`).
 *
 * Executing this operation returns the identifier which can be used to refer to the variable.
 */
class TcbBlockVariableOp extends TcbOp {
    constructor(tcb, scope, initializer, variable) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.initializer = initializer;
        this.variable = variable;
    }
    get optional() {
        return false;
    }
    execute() {
        const id = this.tcb.allocateId();
        addParseSpanInfo(id, this.variable.keySpan);
        const variable = tsCreateVariable(id, wrapForTypeChecker(this.initializer));
        addParseSpanInfo(variable.declarationList.declarations[0], this.variable.sourceSpan);
        this.scope.addStatement(variable);
        return id;
    }
}
/**
 * A `TcbOp` which renders a variable that is implicitly available within a block (e.g. `$count`
 * in a `@for` block).
 *
 * Executing this operation returns the identifier which can be used to refer to the variable.
 */
class TcbBlockImplicitVariableOp extends TcbOp {
    constructor(tcb, scope, type, variable) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.type = type;
        this.variable = variable;
        this.optional = true;
    }
    execute() {
        const id = this.tcb.allocateId();
        addParseSpanInfo(id, this.variable.keySpan);
        const variable = tsDeclareVariable(id, this.type);
        addParseSpanInfo(variable.declarationList.declarations[0], this.variable.sourceSpan);
        this.scope.addStatement(variable);
        return id;
    }
}
/**
 * A `TcbOp` which renders an `if` template block as a TypeScript `if` statement.
 *
 * Executing this operation returns nothing.
 */
class TcbIfOp extends TcbOp {
    constructor(tcb, scope, block) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.block = block;
        this.expressionScopes = new Map();
    }
    get optional() {
        return false;
    }
    execute() {
        const root = this.generateBranch(0);
        root && this.scope.addStatement(root);
        return null;
    }
    generateBranch(index) {
        const branch = this.block.branches[index];
        if (!branch) {
            return undefined;
        }
        // If the expression is null, it means that it's an `else` statement.
        if (branch.expression === null) {
            const branchScope = this.getBranchScope(this.scope, branch, index);
            return ts__default["default"].factory.createBlock(branchScope.render());
        }
        // We process the expression first in the parent scope, but create a scope around the block
        // that the body will inherit from. We do this, because we need to declare a separate variable
        // for the case where the expression has an alias _and_ because we need the processed
        // expression when generating the guard for the body.
        const outerScope = Scope.forNodes(this.tcb, this.scope, branch, [], null);
        outerScope.render().forEach((stmt) => this.scope.addStatement(stmt));
        this.expressionScopes.set(branch, outerScope);
        let expression = tcbExpression(branch.expression, this.tcb, this.scope);
        if (branch.expressionAlias !== null) {
            expression = ts__default["default"].factory.createBinaryExpression(ts__default["default"].factory.createParenthesizedExpression(expression), ts__default["default"].SyntaxKind.AmpersandAmpersandToken, outerScope.resolve(branch.expressionAlias));
        }
        const bodyScope = this.getBranchScope(outerScope, branch, index);
        return ts__default["default"].factory.createIfStatement(expression, ts__default["default"].factory.createBlock(bodyScope.render()), this.generateBranch(index + 1));
    }
    getBranchScope(parentScope, branch, index) {
        const checkBody = this.tcb.env.config.checkControlFlowBodies;
        return Scope.forNodes(this.tcb, parentScope, null, checkBody ? branch.children : [], checkBody ? this.generateBranchGuard(index) : null);
    }
    generateBranchGuard(index) {
        let guard = null;
        // Since event listeners are inside callbacks, type narrowing doesn't apply to them anymore.
        // To recreate the behavior, we generate an expression that negates all the values of the
        // branches _before_ the current one, and then we add the current branch's expression on top.
        // For example `@if (expr === 1) {} @else if (expr === 2) {} @else if (expr === 3)`, the guard
        // for the last expression will be `!(expr === 1) && !(expr === 2) && expr === 3`.
        for (let i = 0; i <= index; i++) {
            const branch = this.block.branches[i];
            // Skip over branches without an expression.
            if (branch.expression === null) {
                continue;
            }
            // This shouldn't happen since all the state is handled
            // internally, but we have the check just in case.
            if (!this.expressionScopes.has(branch)) {
                throw new Error(`Could not determine expression scope of branch at index ${i}`);
            }
            const expressionScope = this.expressionScopes.get(branch);
            let expression;
            // We need to recreate the expression and mark it to be ignored for diagnostics,
            // because it was already checked as a part of the block's condition and we don't
            // want it to produce a duplicate diagnostic.
            expression = tcbExpression(branch.expression, this.tcb, expressionScope);
            if (branch.expressionAlias !== null) {
                expression = ts__default["default"].factory.createBinaryExpression(ts__default["default"].factory.createParenthesizedExpression(expression), ts__default["default"].SyntaxKind.AmpersandAmpersandToken, expressionScope.resolve(branch.expressionAlias));
            }
            markIgnoreDiagnostics(expression);
            // The expressions of the preceding branches have to be negated
            // (e.g. `expr` becomes `!(expr)`) when comparing in the guard, except
            // for the branch's own expression which is preserved as is.
            const comparisonExpression = i === index
                ? expression
                : ts__default["default"].factory.createPrefixUnaryExpression(ts__default["default"].SyntaxKind.ExclamationToken, ts__default["default"].factory.createParenthesizedExpression(expression));
            // Finally add the expression to the guard with an && operator.
            guard =
                guard === null
                    ? comparisonExpression
                    : ts__default["default"].factory.createBinaryExpression(guard, ts__default["default"].SyntaxKind.AmpersandAmpersandToken, comparisonExpression);
        }
        return guard;
    }
}
/**
 * A `TcbOp` which renders a `switch` block as a TypeScript `switch` statement.
 *
 * Executing this operation returns nothing.
 */
class TcbSwitchOp extends TcbOp {
    constructor(tcb, scope, block) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.block = block;
    }
    get optional() {
        return false;
    }
    execute() {
        const switchExpression = tcbExpression(this.block.expression, this.tcb, this.scope);
        const clauses = this.block.cases.map((current) => {
            const checkBody = this.tcb.env.config.checkControlFlowBodies;
            const clauseScope = Scope.forNodes(this.tcb, this.scope, null, checkBody ? current.children : [], checkBody ? this.generateGuard(current, switchExpression) : null);
            const statements = [...clauseScope.render(), ts__default["default"].factory.createBreakStatement()];
            return current.expression === null
                ? ts__default["default"].factory.createDefaultClause(statements)
                : ts__default["default"].factory.createCaseClause(tcbExpression(current.expression, this.tcb, clauseScope), statements);
        });
        this.scope.addStatement(ts__default["default"].factory.createSwitchStatement(switchExpression, ts__default["default"].factory.createCaseBlock(clauses)));
        return null;
    }
    generateGuard(node, switchValue) {
        // For non-default cases, the guard needs to compare against the case value, e.g.
        // `switchExpression === caseExpression`.
        if (node.expression !== null) {
            // The expression needs to be ignored for diagnostics since it has been checked already.
            const expression = tcbExpression(node.expression, this.tcb, this.scope);
            markIgnoreDiagnostics(expression);
            return ts__default["default"].factory.createBinaryExpression(switchValue, ts__default["default"].SyntaxKind.EqualsEqualsEqualsToken, expression);
        }
        // To fully narrow the type in the default case, we need to generate an expression that negates
        // the values of all of the other expressions. For example:
        // @switch (expr) {
        //   @case (1) {}
        //   @case (2) {}
        //   @default {}
        // }
        // Will produce the guard `expr !== 1 && expr !== 2`.
        let guard = null;
        for (const current of this.block.cases) {
            if (current.expression === null) {
                continue;
            }
            // The expression needs to be ignored for diagnostics since it has been checked already.
            const expression = tcbExpression(current.expression, this.tcb, this.scope);
            markIgnoreDiagnostics(expression);
            const comparison = ts__default["default"].factory.createBinaryExpression(switchValue, ts__default["default"].SyntaxKind.ExclamationEqualsEqualsToken, expression);
            if (guard === null) {
                guard = comparison;
            }
            else {
                guard = ts__default["default"].factory.createBinaryExpression(guard, ts__default["default"].SyntaxKind.AmpersandAmpersandToken, comparison);
            }
        }
        return guard;
    }
}
/**
 * A `TcbOp` which renders a `for` block as a TypeScript `for...of` loop.
 *
 * Executing this operation returns nothing.
 */
class TcbForOfOp extends TcbOp {
    constructor(tcb, scope, block) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.block = block;
    }
    get optional() {
        return false;
    }
    execute() {
        const loopScope = Scope.forNodes(this.tcb, this.scope, this.block, this.tcb.env.config.checkControlFlowBodies ? this.block.children : [], null);
        const initializerId = loopScope.resolve(this.block.item);
        if (!ts__default["default"].isIdentifier(initializerId)) {
            throw new Error(`Could not resolve for loop variable ${this.block.item.name} to an identifier`);
        }
        const initializer = ts__default["default"].factory.createVariableDeclarationList([ts__default["default"].factory.createVariableDeclaration(initializerId)], ts__default["default"].NodeFlags.Const);
        addParseSpanInfo(initializer, this.block.item.keySpan);
        // It's common to have a for loop over a nullable value (e.g. produced by the `async` pipe).
        // Add a non-null expression to allow such values to be assigned.
        const expression = ts__default["default"].factory.createNonNullExpression(tcbExpression(this.block.expression, this.tcb, this.scope));
        const trackTranslator = new TcbForLoopTrackTranslator(this.tcb, loopScope, this.block);
        const trackExpression = trackTranslator.translate(this.block.trackBy);
        const statements = [
            ...loopScope.render(),
            ts__default["default"].factory.createExpressionStatement(trackExpression),
        ];
        this.scope.addStatement(ts__default["default"].factory.createForOfStatement(undefined, initializer, expression, ts__default["default"].factory.createBlock(statements)));
        return null;
    }
}
/**
 * Value used to break a circular reference between `TcbOp`s.
 *
 * This value is returned whenever `TcbOp`s have a circular dependency. The expression is a non-null
 * assertion of the null value (in TypeScript, the expression `null!`). This construction will infer
 * the least narrow type for whatever it's assigned to.
 */
const INFER_TYPE_FOR_CIRCULAR_OP_EXPR = ts__default["default"].factory.createNonNullExpression(ts__default["default"].factory.createNull());
/**
 * Local scope within the type check block for a particular template.
 *
 * The top-level template and each nested `<ng-template>` have their own `Scope`, which exist in a
 * hierarchy. The structure of this hierarchy mirrors the syntactic scopes in the generated type
 * check block, where each nested template is encased in an `if` structure.
 *
 * As a template's `TcbOp`s are executed in a given `Scope`, statements are added via
 * `addStatement()`. When this processing is complete, the `Scope` can be turned into a `ts.Block`
 * via `renderToBlock()`.
 *
 * If a `TcbOp` requires the output of another, it can call `resolve()`.
 */
class Scope {
    /**
     * Names of the for loop context variables and their types.
     */
    static { this.forLoopContextVariableTypes = new Map([
        ['$first', ts__default["default"].SyntaxKind.BooleanKeyword],
        ['$last', ts__default["default"].SyntaxKind.BooleanKeyword],
        ['$even', ts__default["default"].SyntaxKind.BooleanKeyword],
        ['$odd', ts__default["default"].SyntaxKind.BooleanKeyword],
        ['$index', ts__default["default"].SyntaxKind.NumberKeyword],
        ['$count', ts__default["default"].SyntaxKind.NumberKeyword],
    ]); }
    constructor(tcb, parent = null, guard = null) {
        this.tcb = tcb;
        this.parent = parent;
        this.guard = guard;
        /**
         * A queue of operations which need to be performed to generate the TCB code for this scope.
         *
         * This array can contain either a `TcbOp` which has yet to be executed, or a `ts.Expression|null`
         * representing the memoized result of executing the operation. As operations are executed, their
         * results are written into the `opQueue`, overwriting the original operation.
         *
         * If an operation is in the process of being executed, it is temporarily overwritten here with
         * `INFER_TYPE_FOR_CIRCULAR_OP_EXPR`. This way, if a cycle is encountered where an operation
         * depends transitively on its own result, the inner operation will infer the least narrow type
         * that fits instead. This has the same semantics as TypeScript itself when types are referenced
         * circularly.
         */
        this.opQueue = [];
        /**
         * A map of `TmplAstElement`s to the index of their `TcbElementOp` in the `opQueue`
         */
        this.elementOpMap = new Map();
        /**
         * A map of maps which tracks the index of `TcbDirectiveCtorOp`s in the `opQueue` for each
         * directive on a `TmplAstElement` or `TmplAstTemplate` node.
         */
        this.directiveOpMap = new Map();
        /**
         * A map of `TmplAstReference`s to the index of their `TcbReferenceOp` in the `opQueue`
         */
        this.referenceOpMap = new Map();
        /**
         * Map of immediately nested <ng-template>s (within this `Scope`) represented by `TmplAstTemplate`
         * nodes to the index of their `TcbTemplateContextOp`s in the `opQueue`.
         */
        this.templateCtxOpMap = new Map();
        /**
         * Map of variables declared on the template that created this `Scope` (represented by
         * `TmplAstVariable` nodes) to the index of their `TcbVariableOp`s in the `opQueue`, or to
         * pre-resolved variable identifiers.
         */
        this.varMap = new Map();
        /**
         * A map of the names of `TmplAstLetDeclaration`s to the index of their op in the `opQueue`.
         *
         * Assumes that there won't be duplicated `@let` declarations within the same scope.
         */
        this.letDeclOpMap = new Map();
        /**
         * Statements for this template.
         *
         * Executing the `TcbOp`s in the `opQueue` populates this array.
         */
        this.statements = [];
    }
    /**
     * Constructs a `Scope` given either a `TmplAstTemplate` or a list of `TmplAstNode`s.
     *
     * @param tcb the overall context of TCB generation.
     * @param parentScope the `Scope` of the parent template (if any) or `null` if this is the root
     * `Scope`.
     * @param scopedNode Node that provides the scope around the child nodes (e.g. a
     * `TmplAstTemplate` node exposing variables to its children).
     * @param children Child nodes that should be appended to the TCB.
     * @param guard an expression that is applied to this scope for type narrowing purposes.
     */
    static forNodes(tcb, parentScope, scopedNode, children, guard) {
        const scope = new Scope(tcb, parentScope, guard);
        if (parentScope === null && tcb.env.config.enableTemplateTypeChecker) {
            // Add an autocompletion point for the component context.
            scope.opQueue.push(new TcbComponentContextCompletionOp(scope));
        }
        // If given an actual `TmplAstTemplate` instance, then process any additional information it
        // has.
        if (scopedNode instanceof checker.Template) {
            // The template's variable declarations need to be added as `TcbVariableOp`s.
            const varMap = new Map();
            for (const v of scopedNode.variables) {
                // Validate that variables on the `TmplAstTemplate` are only declared once.
                if (!varMap.has(v.name)) {
                    varMap.set(v.name, v);
                }
                else {
                    const firstDecl = varMap.get(v.name);
                    tcb.oobRecorder.duplicateTemplateVar(tcb.id, v, firstDecl);
                }
                this.registerVariable(scope, v, new TcbTemplateVariableOp(tcb, scope, scopedNode, v));
            }
        }
        else if (scopedNode instanceof checker.IfBlockBranch) {
            const { expression, expressionAlias } = scopedNode;
            if (expression !== null && expressionAlias !== null) {
                this.registerVariable(scope, expressionAlias, new TcbBlockVariableOp(tcb, scope, tcbExpression(expression, tcb, scope), expressionAlias));
            }
        }
        else if (scopedNode instanceof checker.ForLoopBlock) {
            // Register the variable for the loop so it can be resolved by
            // children. It'll be declared once the loop is created.
            const loopInitializer = tcb.allocateId();
            addParseSpanInfo(loopInitializer, scopedNode.item.sourceSpan);
            scope.varMap.set(scopedNode.item, loopInitializer);
            for (const variable of scopedNode.contextVariables) {
                if (!this.forLoopContextVariableTypes.has(variable.value)) {
                    throw new Error(`Unrecognized for loop context variable ${variable.name}`);
                }
                const type = ts__default["default"].factory.createKeywordTypeNode(this.forLoopContextVariableTypes.get(variable.value));
                this.registerVariable(scope, variable, new TcbBlockImplicitVariableOp(tcb, scope, type, variable));
            }
        }
        for (const node of children) {
            scope.appendNode(node);
        }
        // Once everything is registered, we need to check if there are `@let`
        // declarations that conflict with other local symbols defined after them.
        for (const variable of scope.varMap.keys()) {
            Scope.checkConflictingLet(scope, variable);
        }
        for (const ref of scope.referenceOpMap.keys()) {
            Scope.checkConflictingLet(scope, ref);
        }
        return scope;
    }
    /** Registers a local variable with a scope. */
    static registerVariable(scope, variable, op) {
        const opIndex = scope.opQueue.push(op) - 1;
        scope.varMap.set(variable, opIndex);
    }
    /**
     * Look up a `ts.Expression` representing the value of some operation in the current `Scope`,
     * including any parent scope(s). This method always returns a mutable clone of the
     * `ts.Expression` with the comments cleared.
     *
     * @param node a `TmplAstNode` of the operation in question. The lookup performed will depend on
     * the type of this node:
     *
     * Assuming `directive` is not present, then `resolve` will return:
     *
     * * `TmplAstElement` - retrieve the expression for the element DOM node
     * * `TmplAstTemplate` - retrieve the template context variable
     * * `TmplAstVariable` - retrieve a template let- variable
     * * `TmplAstLetDeclaration` - retrieve a template `@let` declaration
     * * `TmplAstReference` - retrieve variable created for the local ref
     *
     * @param directive if present, a directive type on a `TmplAstElement` or `TmplAstTemplate` to
     * look up instead of the default for an element or template node.
     */
    resolve(node, directive) {
        // Attempt to resolve the operation locally.
        const res = this.resolveLocal(node, directive);
        if (res !== null) {
            // We want to get a clone of the resolved expression and clear the trailing comments
            // so they don't continue to appear in every place the expression is used.
            // As an example, this would otherwise produce:
            // var _t1 /**T:DIR*/ /*1,2*/ = _ctor1();
            // _t1 /**T:DIR*/ /*1,2*/.input = 'value';
            //
            // In addition, returning a clone prevents the consumer of `Scope#resolve` from
            // attaching comments at the declaration site.
            let clone;
            if (ts__default["default"].isIdentifier(res)) {
                clone = ts__default["default"].factory.createIdentifier(res.text);
            }
            else if (ts__default["default"].isNonNullExpression(res)) {
                clone = ts__default["default"].factory.createNonNullExpression(res.expression);
            }
            else {
                throw new Error(`Could not resolve ${node} to an Identifier or a NonNullExpression`);
            }
            ts__default["default"].setOriginalNode(clone, res);
            clone.parent = clone.parent;
            return ts__default["default"].setSyntheticTrailingComments(clone, []);
        }
        else if (this.parent !== null) {
            // Check with the parent.
            return this.parent.resolve(node, directive);
        }
        else {
            throw new Error(`Could not resolve ${node} / ${directive}`);
        }
    }
    /**
     * Add a statement to this scope.
     */
    addStatement(stmt) {
        this.statements.push(stmt);
    }
    /**
     * Get the statements.
     */
    render() {
        for (let i = 0; i < this.opQueue.length; i++) {
            // Optional statements cannot be skipped when we are generating the TCB for use
            // by the TemplateTypeChecker.
            const skipOptional = !this.tcb.env.config.enableTemplateTypeChecker;
            this.executeOp(i, skipOptional);
        }
        return this.statements;
    }
    /**
     * Returns an expression of all template guards that apply to this scope, including those of
     * parent scopes. If no guards have been applied, null is returned.
     */
    guards() {
        let parentGuards = null;
        if (this.parent !== null) {
            // Start with the guards from the parent scope, if present.
            parentGuards = this.parent.guards();
        }
        if (this.guard === null) {
            // This scope does not have a guard, so return the parent's guards as is.
            return parentGuards;
        }
        else if (parentGuards === null) {
            // There's no guards from the parent scope, so this scope's guard represents all available
            // guards.
            return this.guard;
        }
        else {
            // Both the parent scope and this scope provide a guard, so create a combination of the two.
            // It is important that the parent guard is used as left operand, given that it may provide
            // narrowing that is required for this scope's guard to be valid.
            return ts__default["default"].factory.createBinaryExpression(parentGuards, ts__default["default"].SyntaxKind.AmpersandAmpersandToken, this.guard);
        }
    }
    /** Returns whether a template symbol is defined locally within the current scope. */
    isLocal(node) {
        if (node instanceof checker.Variable) {
            return this.varMap.has(node);
        }
        if (node instanceof checker.LetDeclaration) {
            return this.letDeclOpMap.has(node.name);
        }
        return this.referenceOpMap.has(node);
    }
    resolveLocal(ref, directive) {
        if (ref instanceof checker.Reference$1 && this.referenceOpMap.has(ref)) {
            return this.resolveOp(this.referenceOpMap.get(ref));
        }
        else if (ref instanceof checker.LetDeclaration && this.letDeclOpMap.has(ref.name)) {
            return this.resolveOp(this.letDeclOpMap.get(ref.name).opIndex);
        }
        else if (ref instanceof checker.Variable && this.varMap.has(ref)) {
            // Resolving a context variable for this template.
            // Execute the `TcbVariableOp` associated with the `TmplAstVariable`.
            const opIndexOrNode = this.varMap.get(ref);
            return typeof opIndexOrNode === 'number' ? this.resolveOp(opIndexOrNode) : opIndexOrNode;
        }
        else if (ref instanceof checker.Template &&
            directive === undefined &&
            this.templateCtxOpMap.has(ref)) {
            // Resolving the context of the given sub-template.
            // Execute the `TcbTemplateContextOp` for the template.
            return this.resolveOp(this.templateCtxOpMap.get(ref));
        }
        else if ((ref instanceof checker.Element$1 || ref instanceof checker.Template) &&
            directive !== undefined &&
            this.directiveOpMap.has(ref)) {
            // Resolving a directive on an element or sub-template.
            const dirMap = this.directiveOpMap.get(ref);
            if (dirMap.has(directive)) {
                return this.resolveOp(dirMap.get(directive));
            }
            else {
                return null;
            }
        }
        else if (ref instanceof checker.Element$1 && this.elementOpMap.has(ref)) {
            // Resolving the DOM node of an element in this template.
            return this.resolveOp(this.elementOpMap.get(ref));
        }
        else {
            return null;
        }
    }
    /**
     * Like `executeOp`, but assert that the operation actually returned `ts.Expression`.
     */
    resolveOp(opIndex) {
        const res = this.executeOp(opIndex, /* skipOptional */ false);
        if (res === null) {
            throw new Error(`Error resolving operation, got null`);
        }
        return res;
    }
    /**
     * Execute a particular `TcbOp` in the `opQueue`.
     *
     * This method replaces the operation in the `opQueue` with the result of execution (once done)
     * and also protects against a circular dependency from the operation to itself by temporarily
     * setting the operation's result to a special expression.
     */
    executeOp(opIndex, skipOptional) {
        const op = this.opQueue[opIndex];
        if (!(op instanceof TcbOp)) {
            return op;
        }
        if (skipOptional && op.optional) {
            return null;
        }
        // Set the result of the operation in the queue to its circular fallback. If executing this
        // operation results in a circular dependency, this will prevent an infinite loop and allow for
        // the resolution of such cycles.
        this.opQueue[opIndex] = op.circularFallback();
        const res = op.execute();
        // Once the operation has finished executing, it's safe to cache the real result.
        this.opQueue[opIndex] = res;
        return res;
    }
    appendNode(node) {
        if (node instanceof checker.Element$1) {
            const opIndex = this.opQueue.push(new TcbElementOp(this.tcb, this, node)) - 1;
            this.elementOpMap.set(node, opIndex);
            if (this.tcb.env.config.controlFlowPreventingContentProjection !== 'suppress') {
                this.appendContentProjectionCheckOp(node);
            }
            this.appendDirectivesAndInputsOfNode(node);
            this.appendOutputsOfNode(node);
            this.appendChildren(node);
            this.checkAndAppendReferencesOfNode(node);
        }
        else if (node instanceof checker.Template) {
            // Template children are rendered in a child scope.
            this.appendDirectivesAndInputsOfNode(node);
            this.appendOutputsOfNode(node);
            const ctxIndex = this.opQueue.push(new TcbTemplateContextOp(this.tcb, this)) - 1;
            this.templateCtxOpMap.set(node, ctxIndex);
            if (this.tcb.env.config.checkTemplateBodies) {
                this.opQueue.push(new TcbTemplateBodyOp(this.tcb, this, node));
            }
            else if (this.tcb.env.config.alwaysCheckSchemaInTemplateBodies) {
                this.appendDeepSchemaChecks(node.children);
            }
            this.checkAndAppendReferencesOfNode(node);
        }
        else if (node instanceof checker.DeferredBlock) {
            this.appendDeferredBlock(node);
        }
        else if (node instanceof checker.IfBlock) {
            this.opQueue.push(new TcbIfOp(this.tcb, this, node));
        }
        else if (node instanceof checker.SwitchBlock) {
            this.opQueue.push(new TcbSwitchOp(this.tcb, this, node));
        }
        else if (node instanceof checker.ForLoopBlock) {
            this.opQueue.push(new TcbForOfOp(this.tcb, this, node));
            node.empty && this.tcb.env.config.checkControlFlowBodies && this.appendChildren(node.empty);
        }
        else if (node instanceof checker.BoundText) {
            this.opQueue.push(new TcbExpressionOp(this.tcb, this, node.value));
        }
        else if (node instanceof checker.Icu$1) {
            this.appendIcuExpressions(node);
        }
        else if (node instanceof checker.Content) {
            this.appendChildren(node);
        }
        else if (node instanceof checker.LetDeclaration) {
            const opIndex = this.opQueue.push(new TcbLetDeclarationOp(this.tcb, this, node)) - 1;
            if (this.isLocal(node)) {
                this.tcb.oobRecorder.conflictingDeclaration(this.tcb.id, node);
            }
            else {
                this.letDeclOpMap.set(node.name, { opIndex, node });
            }
        }
    }
    appendChildren(node) {
        for (const child of node.children) {
            this.appendNode(child);
        }
    }
    checkAndAppendReferencesOfNode(node) {
        for (const ref of node.references) {
            const target = this.tcb.boundTarget.getReferenceTarget(ref);
            let ctxIndex;
            if (target === null) {
                // The reference is invalid if it doesn't have a target, so report it as an error.
                this.tcb.oobRecorder.missingReferenceTarget(this.tcb.id, ref);
                // Any usages of the invalid reference will be resolved to a variable of type any.
                ctxIndex = this.opQueue.push(new TcbInvalidReferenceOp(this.tcb, this)) - 1;
            }
            else if (target instanceof checker.Template || target instanceof checker.Element$1) {
                ctxIndex = this.opQueue.push(new TcbReferenceOp(this.tcb, this, ref, node, target)) - 1;
            }
            else {
                ctxIndex =
                    this.opQueue.push(new TcbReferenceOp(this.tcb, this, ref, node, target.directive)) - 1;
            }
            this.referenceOpMap.set(ref, ctxIndex);
        }
    }
    appendDirectivesAndInputsOfNode(node) {
        // Collect all the inputs on the element.
        const claimedInputs = new Set();
        const directives = this.tcb.boundTarget.getDirectivesOfNode(node);
        if (directives === null || directives.length === 0) {
            // If there are no directives, then all inputs are unclaimed inputs, so queue an operation
            // to add them if needed.
            if (node instanceof checker.Element$1) {
                this.opQueue.push(new TcbUnclaimedInputsOp(this.tcb, this, node, claimedInputs));
                this.opQueue.push(new TcbDomSchemaCheckerOp(this.tcb, node, /* checkElement */ true, claimedInputs));
            }
            return;
        }
        else {
            if (node instanceof checker.Element$1) {
                const isDeferred = this.tcb.boundTarget.isDeferred(node);
                if (!isDeferred && directives.some((dirMeta) => dirMeta.isExplicitlyDeferred)) {
                    // This node has directives/components that were defer-loaded (included into
                    // `@Component.deferredImports`), but the node itself was used outside of a
                    // `@defer` block, which is the error.
                    this.tcb.oobRecorder.deferredComponentUsedEagerly(this.tcb.id, node);
                }
            }
        }
        const dirMap = new Map();
        for (const dir of directives) {
            let directiveOp;
            const host = this.tcb.env.reflector;
            const dirRef = dir.ref;
            if (!dir.isGeneric) {
                // The most common case is that when a directive is not generic, we use the normal
                // `TcbNonDirectiveTypeOp`.
                directiveOp = new TcbNonGenericDirectiveTypeOp(this.tcb, this, node, dir);
            }
            else if (!requiresInlineTypeCtor(dirRef.node, host, this.tcb.env) ||
                this.tcb.env.config.useInlineTypeConstructors) {
                // For generic directives, we use a type constructor to infer types. If a directive requires
                // an inline type constructor, then inlining must be available to use the
                // `TcbDirectiveCtorOp`. If not we, we fallback to using `any` – see below.
                directiveOp = new TcbDirectiveCtorOp(this.tcb, this, node, dir);
            }
            else {
                // If inlining is not available, then we give up on inferring the generic params, and use
                // `any` type for the directive's generic parameters.
                directiveOp = new TcbGenericDirectiveTypeWithAnyParamsOp(this.tcb, this, node, dir);
            }
            const dirIndex = this.opQueue.push(directiveOp) - 1;
            dirMap.set(dir, dirIndex);
            this.opQueue.push(new TcbDirectiveInputsOp(this.tcb, this, node, dir));
        }
        this.directiveOpMap.set(node, dirMap);
        // After expanding the directives, we might need to queue an operation to check any unclaimed
        // inputs.
        if (node instanceof checker.Element$1) {
            // Go through the directives and remove any inputs that it claims from `elementInputs`.
            for (const dir of directives) {
                for (const propertyName of dir.inputs.propertyNames) {
                    claimedInputs.add(propertyName);
                }
            }
            this.opQueue.push(new TcbUnclaimedInputsOp(this.tcb, this, node, claimedInputs));
            // If there are no directives which match this element, then it's a "plain" DOM element (or a
            // web component), and should be checked against the DOM schema. If any directives match,
            // we must assume that the element could be custom (either a component, or a directive like
            // <router-outlet>) and shouldn't validate the element name itself.
            const checkElement = directives.length === 0;
            this.opQueue.push(new TcbDomSchemaCheckerOp(this.tcb, node, checkElement, claimedInputs));
        }
    }
    appendOutputsOfNode(node) {
        // Collect all the outputs on the element.
        const claimedOutputs = new Set();
        const directives = this.tcb.boundTarget.getDirectivesOfNode(node);
        if (directives === null || directives.length === 0) {
            // If there are no directives, then all outputs are unclaimed outputs, so queue an operation
            // to add them if needed.
            if (node instanceof checker.Element$1) {
                this.opQueue.push(new TcbUnclaimedOutputsOp(this.tcb, this, node, claimedOutputs));
            }
            return;
        }
        // Queue operations for all directives to check the relevant outputs for a directive.
        for (const dir of directives) {
            this.opQueue.push(new TcbDirectiveOutputsOp(this.tcb, this, node, dir));
        }
        // After expanding the directives, we might need to queue an operation to check any unclaimed
        // outputs.
        if (node instanceof checker.Element$1) {
            // Go through the directives and register any outputs that it claims in `claimedOutputs`.
            for (const dir of directives) {
                for (const outputProperty of dir.outputs.propertyNames) {
                    claimedOutputs.add(outputProperty);
                }
            }
            this.opQueue.push(new TcbUnclaimedOutputsOp(this.tcb, this, node, claimedOutputs));
        }
    }
    appendDeepSchemaChecks(nodes) {
        for (const node of nodes) {
            if (!(node instanceof checker.Element$1 || node instanceof checker.Template)) {
                continue;
            }
            if (node instanceof checker.Element$1) {
                const claimedInputs = new Set();
                const directives = this.tcb.boundTarget.getDirectivesOfNode(node);
                let hasDirectives;
                if (directives === null || directives.length === 0) {
                    hasDirectives = false;
                }
                else {
                    hasDirectives = true;
                    for (const dir of directives) {
                        for (const propertyName of dir.inputs.propertyNames) {
                            claimedInputs.add(propertyName);
                        }
                    }
                }
                this.opQueue.push(new TcbDomSchemaCheckerOp(this.tcb, node, !hasDirectives, claimedInputs));
            }
            this.appendDeepSchemaChecks(node.children);
        }
    }
    appendIcuExpressions(node) {
        for (const variable of Object.values(node.vars)) {
            this.opQueue.push(new TcbExpressionOp(this.tcb, this, variable.value));
        }
        for (const placeholder of Object.values(node.placeholders)) {
            if (placeholder instanceof checker.BoundText) {
                this.opQueue.push(new TcbExpressionOp(this.tcb, this, placeholder.value));
            }
        }
    }
    appendContentProjectionCheckOp(root) {
        const meta = this.tcb.boundTarget.getDirectivesOfNode(root)?.find((meta) => meta.isComponent) || null;
        if (meta !== null && meta.ngContentSelectors !== null && meta.ngContentSelectors.length > 0) {
            const selectors = meta.ngContentSelectors;
            // We don't need to generate anything for components that don't have projection
            // slots, or they only have one catch-all slot (represented by `*`).
            if (selectors.length > 1 || (selectors.length === 1 && selectors[0] !== '*')) {
                this.opQueue.push(new TcbControlFlowContentProjectionOp(this.tcb, root, selectors, meta.name));
            }
        }
    }
    appendDeferredBlock(block) {
        this.appendDeferredTriggers(block, block.triggers);
        this.appendDeferredTriggers(block, block.prefetchTriggers);
        // Only the `when` hydration trigger needs to be checked.
        if (block.hydrateTriggers.when) {
            this.opQueue.push(new TcbExpressionOp(this.tcb, this, block.hydrateTriggers.when.value));
        }
        this.appendChildren(block);
        if (block.placeholder !== null) {
            this.appendChildren(block.placeholder);
        }
        if (block.loading !== null) {
            this.appendChildren(block.loading);
        }
        if (block.error !== null) {
            this.appendChildren(block.error);
        }
    }
    appendDeferredTriggers(block, triggers) {
        if (triggers.when !== undefined) {
            this.opQueue.push(new TcbExpressionOp(this.tcb, this, triggers.when.value));
        }
        if (triggers.hover !== undefined) {
            this.appendReferenceBasedDeferredTrigger(block, triggers.hover);
        }
        if (triggers.interaction !== undefined) {
            this.appendReferenceBasedDeferredTrigger(block, triggers.interaction);
        }
        if (triggers.viewport !== undefined) {
            this.appendReferenceBasedDeferredTrigger(block, triggers.viewport);
        }
    }
    appendReferenceBasedDeferredTrigger(block, trigger) {
        if (this.tcb.boundTarget.getDeferredTriggerTarget(block, trigger) === null) {
            this.tcb.oobRecorder.inaccessibleDeferredTriggerElement(this.tcb.id, trigger);
        }
    }
    /** Reports a diagnostic if there are any `@let` declarations that conflict with a node. */
    static checkConflictingLet(scope, node) {
        if (scope.letDeclOpMap.has(node.name)) {
            scope.tcb.oobRecorder.conflictingDeclaration(scope.tcb.id, scope.letDeclOpMap.get(node.name).node);
        }
    }
}
/**
 * Process an `AST` expression and convert it into a `ts.Expression`, generating references to the
 * correct identifiers in the current scope.
 */
function tcbExpression(ast, tcb, scope) {
    const translator = new TcbExpressionTranslator(tcb, scope);
    return translator.translate(ast);
}
class TcbExpressionTranslator {
    constructor(tcb, scope) {
        this.tcb = tcb;
        this.scope = scope;
    }
    translate(ast) {
        // `astToTypescript` actually does the conversion. A special resolver `tcbResolve` is passed
        // which interprets specific expression nodes that interact with the `ImplicitReceiver`. These
        // nodes actually refer to identifiers within the current scope.
        return astToTypescript(ast, (ast) => this.resolve(ast), this.tcb.env.config);
    }
    /**
     * Resolve an `AST` expression within the given scope.
     *
     * Some `AST` expressions refer to top-level concepts (references, variables, the component
     * context). This method assists in resolving those.
     */
    resolve(ast) {
        if (ast instanceof checker.PropertyRead &&
            ast.receiver instanceof checker.ImplicitReceiver &&
            !(ast.receiver instanceof checker.ThisReceiver)) {
            // Try to resolve a bound target for this expression. If no such target is available, then
            // the expression is referencing the top-level component context. In that case, `null` is
            // returned here to let it fall through resolution so it will be caught when the
            // `ImplicitReceiver` is resolved in the branch below.
            const target = this.tcb.boundTarget.getExpressionTarget(ast);
            const targetExpression = target === null ? null : this.getTargetNodeExpression(target, ast);
            if (target instanceof checker.LetDeclaration &&
                !this.isValidLetDeclarationAccess(target, ast)) {
                this.tcb.oobRecorder.letUsedBeforeDefinition(this.tcb.id, ast, target);
                // Cast the expression to `any` so we don't produce additional diagnostics.
                // We don't use `markIgnoreForDiagnostics` here, because it won't prevent duplicate
                // diagnostics for nested accesses in cases like `@let value = value.foo.bar.baz`.
                if (targetExpression !== null) {
                    return ts__default["default"].factory.createAsExpression(targetExpression, ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword));
                }
            }
            return targetExpression;
        }
        else if (ast instanceof checker.PropertyWrite && ast.receiver instanceof checker.ImplicitReceiver) {
            const target = this.tcb.boundTarget.getExpressionTarget(ast);
            if (target === null) {
                return null;
            }
            const targetExpression = this.getTargetNodeExpression(target, ast);
            const expr = this.translate(ast.value);
            const result = ts__default["default"].factory.createParenthesizedExpression(ts__default["default"].factory.createBinaryExpression(targetExpression, ts__default["default"].SyntaxKind.EqualsToken, expr));
            addParseSpanInfo(result, ast.sourceSpan);
            // Ignore diagnostics from TS produced for writes to `@let` and re-report them using
            // our own infrastructure. We can't rely on the TS reporting, because it includes
            // the name of the auto-generated TCB variable name.
            if (target instanceof checker.LetDeclaration) {
                markIgnoreDiagnostics(result);
                this.tcb.oobRecorder.illegalWriteToLetDeclaration(this.tcb.id, ast, target);
            }
            return result;
        }
        else if (ast instanceof checker.ImplicitReceiver) {
            // AST instances representing variables and references look very similar to property reads
            // or method calls from the component context: both have the shape
            // PropertyRead(ImplicitReceiver, 'propName') or Call(ImplicitReceiver, 'methodName').
            //
            // `translate` will first try to `resolve` the outer PropertyRead/Call. If this works,
            // it's because the `BoundTarget` found an expression target for the whole expression, and
            // therefore `translate` will never attempt to `resolve` the ImplicitReceiver of that
            // PropertyRead/Call.
            //
            // Therefore if `resolve` is called on an `ImplicitReceiver`, it's because no outer
            // PropertyRead/Call resolved to a variable or reference, and therefore this is a
            // property read or method call on the component context itself.
            return ts__default["default"].factory.createThis();
        }
        else if (ast instanceof checker.BindingPipe) {
            const expr = this.translate(ast.exp);
            const pipeMeta = this.tcb.getPipeByName(ast.name);
            let pipe;
            if (pipeMeta === null) {
                // No pipe by that name exists in scope. Record this as an error.
                this.tcb.oobRecorder.missingPipe(this.tcb.id, ast);
                // Use an 'any' value to at least allow the rest of the expression to be checked.
                pipe = ANY_EXPRESSION;
            }
            else if (pipeMeta.isExplicitlyDeferred &&
                this.tcb.boundTarget.getEagerlyUsedPipes().includes(ast.name)) {
                // This pipe was defer-loaded (included into `@Component.deferredImports`),
                // but was used outside of a `@defer` block, which is the error.
                this.tcb.oobRecorder.deferredPipeUsedEagerly(this.tcb.id, ast);
                // Use an 'any' value to at least allow the rest of the expression to be checked.
                pipe = ANY_EXPRESSION;
            }
            else {
                // Use a variable declared as the pipe's type.
                pipe = this.tcb.env.pipeInst(pipeMeta.ref);
            }
            const args = ast.args.map((arg) => this.translate(arg));
            let methodAccess = ts__default["default"].factory.createPropertyAccessExpression(pipe, 'transform');
            addParseSpanInfo(methodAccess, ast.nameSpan);
            if (!this.tcb.env.config.checkTypeOfPipes) {
                methodAccess = ts__default["default"].factory.createAsExpression(methodAccess, ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword));
            }
            const result = ts__default["default"].factory.createCallExpression(
            /* expression */ methodAccess, 
            /* typeArguments */ undefined, 
            /* argumentsArray */ [expr, ...args]);
            addParseSpanInfo(result, ast.sourceSpan);
            return result;
        }
        else if ((ast instanceof checker.Call || ast instanceof checker.SafeCall) &&
            (ast.receiver instanceof checker.PropertyRead || ast.receiver instanceof checker.SafePropertyRead)) {
            // Resolve the special `$any(expr)` syntax to insert a cast of the argument to type `any`.
            // `$any(expr)` -> `expr as any`
            if (ast.receiver.receiver instanceof checker.ImplicitReceiver &&
                !(ast.receiver.receiver instanceof checker.ThisReceiver) &&
                ast.receiver.name === '$any' &&
                ast.args.length === 1) {
                const expr = this.translate(ast.args[0]);
                const exprAsAny = ts__default["default"].factory.createAsExpression(expr, ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword));
                const result = ts__default["default"].factory.createParenthesizedExpression(exprAsAny);
                addParseSpanInfo(result, ast.sourceSpan);
                return result;
            }
            // Attempt to resolve a bound target for the method, and generate the method call if a target
            // could be resolved. If no target is available, then the method is referencing the top-level
            // component context, in which case `null` is returned to let the `ImplicitReceiver` being
            // resolved to the component context.
            const target = this.tcb.boundTarget.getExpressionTarget(ast);
            if (target === null) {
                return null;
            }
            const receiver = this.getTargetNodeExpression(target, ast);
            const method = wrapForDiagnostics(receiver);
            addParseSpanInfo(method, ast.receiver.nameSpan);
            const args = ast.args.map((arg) => this.translate(arg));
            const node = ts__default["default"].factory.createCallExpression(method, undefined, args);
            addParseSpanInfo(node, ast.sourceSpan);
            return node;
        }
        else {
            // This AST isn't special after all.
            return null;
        }
    }
    getTargetNodeExpression(targetNode, expressionNode) {
        const expr = this.scope.resolve(targetNode);
        addParseSpanInfo(expr, expressionNode.sourceSpan);
        return expr;
    }
    isValidLetDeclarationAccess(target, ast) {
        const targetStart = target.sourceSpan.start.offset;
        const targetEnd = target.sourceSpan.end.offset;
        const astStart = ast.sourceSpan.start;
        // We only flag local references that occur before the declaration, because embedded views
        // are updated before the child views. In practice this means that something like
        // `<ng-template [ngIf]="true">{{value}}</ng-template> @let value = 1;` is valid.
        return (targetStart < astStart && astStart > targetEnd) || !this.scope.isLocal(target);
    }
}
/**
 * Call the type constructor of a directive instance on a given template node, inferring a type for
 * the directive instance from any bound inputs.
 */
function tcbCallTypeCtor(dir, tcb, inputs) {
    const typeCtor = tcb.env.typeCtorFor(dir);
    // Construct an array of `ts.PropertyAssignment`s for each of the directive's inputs.
    const members = inputs.map((input) => {
        const propertyName = ts__default["default"].factory.createStringLiteral(input.field);
        if (input.type === 'binding') {
            // For bound inputs, the property is assigned the binding expression.
            let expr = widenBinding(input.expression, tcb);
            if (input.isTwoWayBinding && tcb.env.config.allowSignalsInTwoWayBindings) {
                expr = unwrapWritableSignal(expr, tcb);
            }
            const assignment = ts__default["default"].factory.createPropertyAssignment(propertyName, wrapForDiagnostics(expr));
            addParseSpanInfo(assignment, input.sourceSpan);
            return assignment;
        }
        else {
            // A type constructor is required to be called with all input properties, so any unset
            // inputs are simply assigned a value of type `any` to ignore them.
            return ts__default["default"].factory.createPropertyAssignment(propertyName, ANY_EXPRESSION);
        }
    });
    // Call the `ngTypeCtor` method on the directive class, with an object literal argument created
    // from the matched inputs.
    return ts__default["default"].factory.createCallExpression(
    /* expression */ typeCtor, 
    /* typeArguments */ undefined, 
    /* argumentsArray */ [ts__default["default"].factory.createObjectLiteralExpression(members)]);
}
function getBoundAttributes(directive, node) {
    const boundInputs = [];
    const processAttribute = (attr) => {
        // Skip non-property bindings.
        if (attr instanceof checker.BoundAttribute &&
            attr.type !== checker.BindingType.Property &&
            attr.type !== checker.BindingType.TwoWay) {
            return;
        }
        // Skip the attribute if the directive does not have an input for it.
        const inputs = directive.inputs.getByBindingPropertyName(attr.name);
        if (inputs !== null) {
            boundInputs.push({
                attribute: attr,
                inputs: inputs.map((input) => {
                    return {
                        fieldName: input.classPropertyName,
                        required: input.required,
                        transformType: input.transform?.type || null,
                        isSignal: input.isSignal,
                        isTwoWayBinding: attr instanceof checker.BoundAttribute && attr.type === checker.BindingType.TwoWay,
                    };
                }),
            });
        }
    };
    node.inputs.forEach(processAttribute);
    node.attributes.forEach(processAttribute);
    if (node instanceof checker.Template) {
        node.templateAttrs.forEach(processAttribute);
    }
    return boundInputs;
}
/**
 * Translates the given attribute binding to a `ts.Expression`.
 */
function translateInput(attr, tcb, scope) {
    if (attr instanceof checker.BoundAttribute) {
        // Produce an expression representing the value of the binding.
        return tcbExpression(attr.value, tcb, scope);
    }
    else {
        // For regular attributes with a static string value, use the represented string literal.
        return ts__default["default"].factory.createStringLiteral(attr.value);
    }
}
/**
 * Potentially widens the type of `expr` according to the type-checking configuration.
 */
function widenBinding(expr, tcb) {
    if (!tcb.env.config.checkTypeOfInputBindings) {
        // If checking the type of bindings is disabled, cast the resulting expression to 'any'
        // before the assignment.
        return tsCastToAny(expr);
    }
    else if (!tcb.env.config.strictNullInputBindings) {
        if (ts__default["default"].isObjectLiteralExpression(expr) || ts__default["default"].isArrayLiteralExpression(expr)) {
            // Object literals and array literals should not be wrapped in non-null assertions as that
            // would cause literals to be prematurely widened, resulting in type errors when assigning
            // into a literal type.
            return expr;
        }
        else {
            // If strict null checks are disabled, erase `null` and `undefined` from the type by
            // wrapping the expression in a non-null assertion.
            return ts__default["default"].factory.createNonNullExpression(expr);
        }
    }
    else {
        // No widening is requested, use the expression as is.
        return expr;
    }
}
/**
 * Wraps an expression in an `unwrapSignal` call which extracts the signal's value.
 */
function unwrapWritableSignal(expression, tcb) {
    const unwrapRef = tcb.env.referenceExternalSymbol(checker.Identifiers.unwrapWritableSignal.moduleName, checker.Identifiers.unwrapWritableSignal.name);
    return ts__default["default"].factory.createCallExpression(unwrapRef, undefined, [expression]);
}
const EVENT_PARAMETER = '$event';
/**
 * Creates an arrow function to be used as handler function for event bindings. The handler
 * function has a single parameter `$event` and the bound event's handler `AST` represented as a
 * TypeScript expression as its body.
 *
 * When `eventType` is set to `Infer`, the `$event` parameter will not have an explicit type. This
 * allows for the created handler function to have its `$event` parameter's type inferred based on
 * how it's used, to enable strict type checking of event bindings. When set to `Any`, the `$event`
 * parameter will have an explicit `any` type, effectively disabling strict type checking of event
 * bindings. Alternatively, an explicit type can be passed for the `$event` parameter.
 */
function tcbCreateEventHandler(event, tcb, scope, eventType) {
    const handler = tcbEventHandlerExpression(event.handler, tcb, scope);
    let eventParamType;
    if (eventType === 0 /* EventParamType.Infer */) {
        eventParamType = undefined;
    }
    else if (eventType === 1 /* EventParamType.Any */) {
        eventParamType = ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword);
    }
    else {
        eventParamType = eventType;
    }
    // Obtain all guards that have been applied to the scope and its parents, as they have to be
    // repeated within the handler function for their narrowing to be in effect within the handler.
    const guards = scope.guards();
    let body = ts__default["default"].factory.createExpressionStatement(handler);
    if (guards !== null) {
        // Wrap the body in an `if` statement containing all guards that have to be applied.
        body = ts__default["default"].factory.createIfStatement(guards, body);
    }
    const eventParam = ts__default["default"].factory.createParameterDeclaration(
    /* modifiers */ undefined, 
    /* dotDotDotToken */ undefined, 
    /* name */ EVENT_PARAMETER, 
    /* questionToken */ undefined, 
    /* type */ eventParamType);
    addExpressionIdentifier(eventParam, ExpressionIdentifier.EVENT_PARAMETER);
    // Return an arrow function instead of a function expression to preserve the `this` context.
    return ts__default["default"].factory.createArrowFunction(
    /* modifiers */ undefined, 
    /* typeParameters */ undefined, 
    /* parameters */ [eventParam], 
    /* type */ ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword), 
    /* equalsGreaterThanToken */ undefined, 
    /* body */ ts__default["default"].factory.createBlock([body]));
}
/**
 * Similar to `tcbExpression`, this function converts the provided `AST` expression into a
 * `ts.Expression`, with special handling of the `$event` variable that can be used within event
 * bindings.
 */
function tcbEventHandlerExpression(ast, tcb, scope) {
    const translator = new TcbEventHandlerTranslator(tcb, scope);
    return translator.translate(ast);
}
function isSplitTwoWayBinding(inputName, output, inputs, tcb) {
    const input = inputs.find((input) => input.name === inputName);
    if (input === undefined || input.sourceSpan !== output.sourceSpan) {
        return false;
    }
    // Input consumer should be a directive because it's claimed
    const inputConsumer = tcb.boundTarget.getConsumerOfBinding(input);
    const outputConsumer = tcb.boundTarget.getConsumerOfBinding(output);
    if (outputConsumer === null ||
        inputConsumer.ref === undefined ||
        outputConsumer instanceof checker.Template) {
        return false;
    }
    if (outputConsumer instanceof checker.Element$1) {
        tcb.oobRecorder.splitTwoWayBinding(tcb.id, input, output, inputConsumer.ref.node, outputConsumer);
        return true;
    }
    else if (outputConsumer.ref !== inputConsumer.ref) {
        tcb.oobRecorder.splitTwoWayBinding(tcb.id, input, output, inputConsumer.ref.node, outputConsumer.ref.node);
        return true;
    }
    return false;
}
class TcbEventHandlerTranslator extends TcbExpressionTranslator {
    resolve(ast) {
        // Recognize a property read on the implicit receiver corresponding with the event parameter
        // that is available in event bindings. Since this variable is a parameter of the handler
        // function that the converted expression becomes a child of, just create a reference to the
        // parameter by its name.
        if (ast instanceof checker.PropertyRead &&
            ast.receiver instanceof checker.ImplicitReceiver &&
            !(ast.receiver instanceof checker.ThisReceiver) &&
            ast.name === EVENT_PARAMETER) {
            const event = ts__default["default"].factory.createIdentifier(EVENT_PARAMETER);
            addParseSpanInfo(event, ast.nameSpan);
            return event;
        }
        return super.resolve(ast);
    }
    isValidLetDeclarationAccess() {
        // Event listeners are allowed to read `@let` declarations before
        // they're declared since the callback won't be executed immediately.
        return true;
    }
}
class TcbForLoopTrackTranslator extends TcbExpressionTranslator {
    constructor(tcb, scope, block) {
        super(tcb, scope);
        this.block = block;
        // Tracking expressions are only allowed to read the `$index`,
        // the item and properties off the component instance.
        this.allowedVariables = new Set([block.item]);
        for (const variable of block.contextVariables) {
            if (variable.value === '$index') {
                this.allowedVariables.add(variable);
            }
        }
    }
    resolve(ast) {
        if (ast instanceof checker.PropertyRead && ast.receiver instanceof checker.ImplicitReceiver) {
            const target = this.tcb.boundTarget.getExpressionTarget(ast);
            if (target !== null &&
                (!(target instanceof checker.Variable) || !this.allowedVariables.has(target))) {
                this.tcb.oobRecorder.illegalForLoopTrackAccess(this.tcb.id, this.block, ast);
            }
        }
        return super.resolve(ast);
    }
}

/**
 * How a type-checking context should handle operations which would require inlining.
 */
var InliningMode;
(function (InliningMode) {
    /**
     * Use inlining operations when required.
     */
    InliningMode[InliningMode["InlineOps"] = 0] = "InlineOps";
    /**
     * Produce diagnostics if an operation would require inlining.
     */
    InliningMode[InliningMode["Error"] = 1] = "Error";
})(InliningMode || (InliningMode = {}));

new checker.DomElementSchemaRegistry();

function isOutputDeclarationEligibleForMigration(node) {
    return (node.initializer !== undefined &&
        ts__default["default"].isNewExpression(node.initializer) &&
        ts__default["default"].isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === 'EventEmitter');
}
function isPotentialOutputCallUsage(node, name) {
    if (ts__default["default"].isCallExpression(node) &&
        ts__default["default"].isPropertyAccessExpression(node.expression) &&
        ts__default["default"].isIdentifier(node.expression.name)) {
        return node.expression?.name.text === name;
    }
    else {
        return false;
    }
}
function isPotentialPipeCallUsage(node) {
    return isPotentialOutputCallUsage(node, 'pipe');
}
function isPotentialNextCallUsage(node) {
    return isPotentialOutputCallUsage(node, 'next');
}
function isPotentialCompleteCallUsage(node) {
    return isPotentialOutputCallUsage(node, 'complete');
}
function isTargetOutputDeclaration(node, checker, reflector, dtsReader) {
    const targetSymbol = checker.getSymbolAtLocation(node);
    if (targetSymbol !== undefined) {
        const propertyDeclaration = getTargetPropertyDeclaration(targetSymbol);
        if (propertyDeclaration !== null &&
            isOutputDeclaration(propertyDeclaration, reflector, dtsReader)) {
            return propertyDeclaration;
        }
    }
    return null;
}
/** Gets whether the given property is an Angular `@Output`. */
function isOutputDeclaration(node, reflector, dtsReader) {
    // `.d.ts` file, so we check the `static ecmp` metadata on the `declare class`.
    if (node.getSourceFile().isDeclarationFile) {
        if (!ts__default["default"].isIdentifier(node.name) ||
            !ts__default["default"].isClassDeclaration(node.parent) ||
            node.parent.name === undefined) {
            return false;
        }
        const ref = new Reference(node.parent);
        const directiveMeta = dtsReader.getDirectiveMetadata(ref);
        return !!directiveMeta?.outputs.getByClassPropertyName(node.name.text);
    }
    // `.ts` file, so we check for the `@Output()` decorator.
    return getOutputDecorator(node, reflector) !== null;
}
function getTargetPropertyDeclaration(targetSymbol) {
    const valDeclaration = targetSymbol.valueDeclaration;
    if (valDeclaration !== undefined && ts__default["default"].isPropertyDeclaration(valDeclaration)) {
        return valDeclaration;
    }
    return null;
}
/** Returns Angular `@Output` decorator or null when a given property declaration is not an @Output */
function getOutputDecorator(node, reflector) {
    const decorators = reflector.getDecoratorsOfDeclaration(node);
    const ngDecorators = decorators !== null ? getAngularDecorators(decorators, ['Output'], /* isCore */ false) : [];
    return ngDecorators.length > 0 ? ngDecorators[0] : null;
}
// THINK: this utility + type is not specific to @Output, really, maybe move it to tsurge?
/** Computes an unique ID for a given Angular `@Output` property. */
function getUniqueIdForProperty(info, prop) {
    const { id } = index.projectFile(prop.getSourceFile(), info);
    id.replace(/\.d\.ts$/, '.ts');
    return `${id}@@${prop.parent.name ?? 'unknown-class'}@@${prop.name.getText()}`;
}
function isTestRunnerImport(node) {
    if (ts__default["default"].isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText();
        return moduleSpecifier.includes('jasmine') || moduleSpecifier.includes('catalyst');
    }
    return false;
}
// TODO: code duplication with signals migration - sort it out
/**
 * Gets whether the given read is used to access
 * the specified field.
 *
 * E.g. whether `<my-read>.toArray` is detected.
 */
function checkNonTsReferenceAccessesField(ref, fieldName) {
    const readFromPath = ref.from.readAstPath.at(-1);
    const parentRead = ref.from.readAstPath.at(-2);
    if (ref.from.read !== readFromPath) {
        return null;
    }
    if (!(parentRead instanceof checker.PropertyRead) || parentRead.name !== fieldName) {
        return null;
    }
    return parentRead;
}
/**
 * Gets whether the given reference is accessed to call the
 * specified function on it.
 *
 * E.g. whether `<my-read>.toArray()` is detected.
 */
function checkNonTsReferenceCallsField(ref, fieldName) {
    const propertyAccess = checkNonTsReferenceAccessesField(ref, fieldName);
    if (propertyAccess === null) {
        return null;
    }
    const accessIdx = ref.from.readAstPath.indexOf(propertyAccess);
    if (accessIdx === -1) {
        return null;
    }
    const potentialRead = ref.from.readAstPath[accessIdx];
    if (potentialRead === undefined) {
        return null;
    }
    return potentialRead;
}

const printer = ts__default["default"].createPrinter();
function calculateDeclarationReplacement(info, node, aliasParam) {
    const sf = node.getSourceFile();
    const payloadTypes = node.initializer !== undefined && ts__default["default"].isNewExpression(node.initializer)
        ? node.initializer?.typeArguments
        : undefined;
    const outputCall = ts__default["default"].factory.createCallExpression(ts__default["default"].factory.createIdentifier('output'), payloadTypes, aliasParam ? [aliasParam] : []);
    const existingModifiers = (node.modifiers ?? []).filter((modifier) => !ts__default["default"].isDecorator(modifier) && modifier.kind !== ts__default["default"].SyntaxKind.ReadonlyKeyword);
    const updatedOutputDeclaration = ts__default["default"].factory.createPropertyDeclaration(
    // Think: this logic of dealing with modifiers is applicable to all signal-based migrations
    ts__default["default"].factory.createNodeArray([
        ...existingModifiers,
        ts__default["default"].factory.createModifier(ts__default["default"].SyntaxKind.ReadonlyKeyword),
    ]), node.name, undefined, undefined, outputCall);
    return prepareTextReplacementForNode(info, node, printer.printNode(ts__default["default"].EmitHint.Unspecified, updatedOutputDeclaration, sf));
}
function calculateImportReplacements(info, sourceFiles) {
    const importReplacements = {};
    const importManager = new ImportManager();
    for (const sf of sourceFiles) {
        const addOnly = [];
        const addRemove = [];
        const file = index.projectFile(sf, info);
        importManager.addImport({
            requestedFile: sf,
            exportModuleSpecifier: '@angular/core',
            exportSymbolName: 'output',
        });
        index.applyImportManagerChanges(importManager, addOnly, [sf], info);
        importManager.removeImport(sf, 'Output', '@angular/core');
        importManager.removeImport(sf, 'EventEmitter', '@angular/core');
        index.applyImportManagerChanges(importManager, addRemove, [sf], info);
        importReplacements[file.id] = {
            add: addOnly,
            addAndRemove: addRemove,
        };
    }
    return importReplacements;
}
function calculateNextFnReplacement(info, node) {
    return prepareTextReplacementForNode(info, node, 'emit');
}
function calculateNextFnReplacementInTemplate(file, span) {
    return prepareTextReplacement(file, 'emit', span.start, span.end);
}
function calculateNextFnReplacementInHostBinding(file, offset, span) {
    return prepareTextReplacement(file, 'emit', offset + span.start, offset + span.end);
}
function calculateCompleteCallReplacement(info, node) {
    return prepareTextReplacementForNode(info, node, '', node.getFullStart());
}
function calculatePipeCallReplacement(info, node) {
    if (ts__default["default"].isPropertyAccessExpression(node.expression)) {
        const sf = node.getSourceFile();
        const importManager = new ImportManager();
        const outputToObservableIdent = importManager.addImport({
            requestedFile: sf,
            exportModuleSpecifier: '@angular/core/rxjs-interop',
            exportSymbolName: 'outputToObservable',
        });
        const toObsCallExp = ts__default["default"].factory.createCallExpression(outputToObservableIdent, undefined, [
            node.expression.expression,
        ]);
        const pipePropAccessExp = ts__default["default"].factory.updatePropertyAccessExpression(node.expression, toObsCallExp, node.expression.name);
        const pipeCallExp = ts__default["default"].factory.updateCallExpression(node, pipePropAccessExp, [], node.arguments);
        const replacements = [
            prepareTextReplacementForNode(info, node, printer.printNode(ts__default["default"].EmitHint.Unspecified, pipeCallExp, sf)),
        ];
        index.applyImportManagerChanges(importManager, replacements, [sf], info);
        return replacements;
    }
    else {
        // TODO: assert instead?
        throw new Error(`Unexpected call expression for .pipe - expected a property access but got "${node.getText()}"`);
    }
}
function prepareTextReplacementForNode(info, node, replacement, start) {
    const sf = node.getSourceFile();
    return new index.Replacement(index.projectFile(sf, info), new index.TextUpdate({
        position: start ?? node.getStart(),
        end: node.getEnd(),
        toInsert: replacement,
    }));
}
function prepareTextReplacement(file, replacement, start, end) {
    return new index.Replacement(file, new index.TextUpdate({
        position: start,
        end: end,
        toInsert: replacement,
    }));
}

class OutputMigration extends index.TsurgeFunnelMigration {
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const { sourceFiles, program: program$1 } = info;
        const outputFieldReplacements = {};
        const problematicUsages = {};
        let problematicDeclarationCount = 0;
        const filesWithOutputDeclarations = new Set();
        const checker = program$1.getTypeChecker();
        const reflector = new TypeScriptReflectionHost(checker);
        const dtsReader = new DtsMetadataReader(checker, reflector);
        const evaluator = new program.PartialEvaluator(reflector, checker, null);
        const ngCompiler = info.ngCompiler;
        assert__default["default"](ngCompiler !== null, 'Requires ngCompiler to run the migration');
        const resourceLoader = ngCompiler['resourceManager'];
        // Pre-Analyze the program and get access to the template type checker.
        const { templateTypeChecker } = ngCompiler['ensureAnalyzed']();
        const knownFields = {
            // Note: We don't support cross-target migration of `Partial<T>` usages.
            // This is an acceptable limitation for performance reasons.
            shouldTrackClassReference: (node) => false,
            attemptRetrieveDescriptorFromSymbol: (s) => {
                const propDeclaration = getTargetPropertyDeclaration(s);
                if (propDeclaration !== null) {
                    const classFieldID = getUniqueIdForProperty(info, propDeclaration);
                    if (classFieldID !== null) {
                        return {
                            node: propDeclaration,
                            key: classFieldID,
                        };
                    }
                }
                return null;
            },
        };
        let isTestFile = false;
        const outputMigrationVisitor = (node) => {
            // detect output declarations
            if (ts__default["default"].isPropertyDeclaration(node)) {
                const outputDecorator = getOutputDecorator(node, reflector);
                if (outputDecorator !== null) {
                    if (isOutputDeclarationEligibleForMigration(node)) {
                        const outputDef = {
                            id: getUniqueIdForProperty(info, node),
                            aliasParam: outputDecorator.args?.at(0),
                        };
                        const outputFile = index.projectFile(node.getSourceFile(), info);
                        if (this.config.shouldMigrate === undefined ||
                            this.config.shouldMigrate({
                                key: outputDef.id,
                                node: node,
                            }, outputFile)) {
                            filesWithOutputDeclarations.add(node.getSourceFile());
                            addOutputReplacement(outputFieldReplacements, outputDef.id, outputFile, calculateDeclarationReplacement(info, node, outputDef.aliasParam));
                        }
                    }
                    else {
                        problematicDeclarationCount++;
                    }
                }
            }
            // detect .next usages that should be migrated to .emit
            if (isPotentialNextCallUsage(node) && ts__default["default"].isPropertyAccessExpression(node.expression)) {
                const propertyDeclaration = isTargetOutputDeclaration(node.expression.expression, checker, reflector, dtsReader);
                if (propertyDeclaration !== null) {
                    const id = getUniqueIdForProperty(info, propertyDeclaration);
                    const outputFile = index.projectFile(node.getSourceFile(), info);
                    addOutputReplacement(outputFieldReplacements, id, outputFile, calculateNextFnReplacement(info, node.expression.name));
                }
            }
            // detect .complete usages that should be removed
            if (isPotentialCompleteCallUsage(node) && ts__default["default"].isPropertyAccessExpression(node.expression)) {
                const propertyDeclaration = isTargetOutputDeclaration(node.expression.expression, checker, reflector, dtsReader);
                if (propertyDeclaration !== null) {
                    const id = getUniqueIdForProperty(info, propertyDeclaration);
                    const outputFile = index.projectFile(node.getSourceFile(), info);
                    if (ts__default["default"].isExpressionStatement(node.parent)) {
                        addOutputReplacement(outputFieldReplacements, id, outputFile, calculateCompleteCallReplacement(info, node.parent));
                    }
                    else {
                        problematicUsages[id] = true;
                    }
                }
            }
            // detect imports of test runners
            if (isTestRunnerImport(node)) {
                isTestFile = true;
            }
            // detect unsafe access of the output property
            if (isPotentialPipeCallUsage(node) && ts__default["default"].isPropertyAccessExpression(node.expression)) {
                const propertyDeclaration = isTargetOutputDeclaration(node.expression.expression, checker, reflector, dtsReader);
                if (propertyDeclaration !== null) {
                    const id = getUniqueIdForProperty(info, propertyDeclaration);
                    if (isTestFile) {
                        const outputFile = index.projectFile(node.getSourceFile(), info);
                        addOutputReplacement(outputFieldReplacements, id, outputFile, ...calculatePipeCallReplacement(info, node));
                    }
                    else {
                        problematicUsages[id] = true;
                    }
                }
            }
            ts__default["default"].forEachChild(node, outputMigrationVisitor);
        };
        // calculate output migration replacements
        for (const sf of sourceFiles) {
            isTestFile = false;
            ts__default["default"].forEachChild(sf, outputMigrationVisitor);
        }
        // take care of the references in templates and host bindings
        const referenceResult = { references: [] };
        const { visitor: templateHostRefVisitor } = index.createFindAllSourceFileReferencesVisitor(info, checker, reflector, resourceLoader, evaluator, templateTypeChecker, knownFields, null, // TODO: capture known output names as an optimization
        referenceResult);
        // calculate template / host binding replacements
        for (const sf of sourceFiles) {
            ts__default["default"].forEachChild(sf, templateHostRefVisitor);
        }
        for (const ref of referenceResult.references) {
            // detect .next usages that should be migrated to .emit in template and host binding expressions
            if (ref.kind === index.ReferenceKind.InTemplate) {
                const callExpr = checkNonTsReferenceCallsField(ref, 'next');
                if (callExpr !== null) {
                    addOutputReplacement(outputFieldReplacements, ref.target.key, ref.from.templateFile, calculateNextFnReplacementInTemplate(ref.from.templateFile, callExpr.nameSpan));
                }
            }
            else if (ref.kind === index.ReferenceKind.InHostBinding) {
                const callExpr = checkNonTsReferenceCallsField(ref, 'next');
                if (callExpr !== null) {
                    addOutputReplacement(outputFieldReplacements, ref.target.key, ref.from.file, calculateNextFnReplacementInHostBinding(ref.from.file, ref.from.hostPropertyNode.getStart() + 1, callExpr.nameSpan));
                }
            }
        }
        // calculate import replacements but do so only for files that have output declarations
        const importReplacements = calculateImportReplacements(info, filesWithOutputDeclarations);
        return index.confirmAsSerializable({
            problematicDeclarationCount,
            outputFields: outputFieldReplacements,
            importReplacements,
            problematicUsages,
        });
    }
    async merge(units) {
        const outputFields = {};
        const importReplacements = {};
        const problematicUsages = {};
        let problematicDeclarationCount = 0;
        for (const unit of units) {
            for (const declIdStr of Object.keys(unit.outputFields)) {
                const declId = declIdStr;
                // THINK: detect clash? Should we have an utility to merge data based on unique IDs?
                outputFields[declId] = unit.outputFields[declId];
            }
            for (const fileIDStr of Object.keys(unit.importReplacements)) {
                const fileID = fileIDStr;
                importReplacements[fileID] = unit.importReplacements[fileID];
            }
            problematicDeclarationCount += unit.problematicDeclarationCount;
        }
        for (const unit of units) {
            for (const declIdStr of Object.keys(unit.problematicUsages)) {
                const declId = declIdStr;
                // it might happen that a problematic usage is detected but we didn't see the declaration - skipping those
                if (outputFields[declId] !== undefined) {
                    problematicUsages[declId] = unit.problematicUsages[declId];
                }
            }
        }
        return index.confirmAsSerializable({
            problematicDeclarationCount,
            outputFields,
            importReplacements,
            problematicUsages,
        });
    }
    async stats(globalMetadata) {
        const detectedOutputs = new Set(Object.keys(globalMetadata.outputFields)).size +
            globalMetadata.problematicDeclarationCount;
        const problematicOutputs = new Set(Object.keys(globalMetadata.problematicUsages)).size +
            globalMetadata.problematicDeclarationCount;
        const successRate = detectedOutputs > 0 ? (detectedOutputs - problematicOutputs) / detectedOutputs : 1;
        return {
            counters: {
                detectedOutputs,
                problematicOutputs,
                successRate,
            },
        };
    }
    async migrate(globalData) {
        const migratedFiles = new Set();
        const problematicFiles = new Set();
        const replacements = [];
        for (const declIdStr of Object.keys(globalData.outputFields)) {
            const declId = declIdStr;
            const outputField = globalData.outputFields[declId];
            if (!globalData.problematicUsages[declId]) {
                replacements.push(...outputField.replacements);
                migratedFiles.add(outputField.file.id);
            }
            else {
                problematicFiles.add(outputField.file.id);
            }
        }
        for (const fileIDStr of Object.keys(globalData.importReplacements)) {
            const fileID = fileIDStr;
            if (migratedFiles.has(fileID)) {
                const importReplacements = globalData.importReplacements[fileID];
                if (problematicFiles.has(fileID)) {
                    replacements.push(...importReplacements.add);
                }
                else {
                    replacements.push(...importReplacements.addAndRemove);
                }
            }
        }
        return { replacements };
    }
}
function addOutputReplacement(outputFieldReplacements, outputId, file, ...replacements) {
    let existingReplacements = outputFieldReplacements[outputId];
    if (existingReplacements === undefined) {
        outputFieldReplacements[outputId] = existingReplacements = {
            file: file,
            replacements: [],
        };
    }
    existingReplacements.replacements.push(...replacements);
}

function migrate(options) {
    return async (tree, context) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        if (!buildPaths.length && !testPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run output migration.');
        }
        const fs = new index.DevkitMigrationFilesystem(tree);
        checker.setFileSystem(fs);
        const migration = new OutputMigration({
            shouldMigrate: (_, file) => {
                return (file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                    !/(^|\/)node_modules\//.test(file.rootRelativePath));
            },
        });
        const analysisPath = fs.resolve(options.analysisDir);
        const unitResults = [];
        const programInfos = [...buildPaths, ...testPaths].map((tsconfigPath) => {
            context.logger.info(`Preparing analysis for: ${tsconfigPath}..`);
            const baseInfo = migration.createProgram(tsconfigPath, fs);
            const info = migration.prepareProgram(baseInfo);
            // Support restricting the analysis to subfolders for larger projects.
            if (analysisPath !== '/') {
                info.sourceFiles = info.sourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
                info.fullProgramSourceFiles = info.fullProgramSourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
            }
            return { info, tsconfigPath };
        });
        // Analyze phase. Treat all projects as compilation units as
        // this allows us to support references between those.
        for (const { info, tsconfigPath } of programInfos) {
            context.logger.info(`Scanning for outputs: ${tsconfigPath}..`);
            unitResults.push(await migration.analyze(info));
        }
        context.logger.info(``);
        context.logger.info(`Processing analysis data between targets..`);
        context.logger.info(``);
        const merged = await migration.merge(unitResults);
        const replacementsPerFile = new Map();
        for (const { info, tsconfigPath } of programInfos) {
            context.logger.info(`Migrating: ${tsconfigPath}..`);
            const { replacements } = await migration.migrate(merged);
            const changesPerFile = index.groupReplacementsByFile(replacements);
            for (const [file, changes] of changesPerFile) {
                if (!replacementsPerFile.has(file)) {
                    replacementsPerFile.set(file, changes);
                }
            }
        }
        context.logger.info(`Applying changes..`);
        for (const [file, changes] of replacementsPerFile) {
            const recorder = tree.beginUpdate(file);
            for (const c of changes) {
                recorder
                    .remove(c.data.position, c.data.end - c.data.position)
                    .insertLeft(c.data.position, c.data.toInsert);
            }
            tree.commitUpdate(recorder);
        }
        const { counters: { detectedOutputs, problematicOutputs, successRate }, } = await migration.stats(merged);
        const migratedOutputs = detectedOutputs - problematicOutputs;
        const successRatePercent = (successRate * 100).toFixed(2);
        context.logger.info('');
        context.logger.info(`Successfully migrated to outputs as functions 🎉`);
        context.logger.info(`  -> Migrated ${migratedOutputs} out of ${detectedOutputs} detected outputs (${successRatePercent} %).`);
    };
}

exports.migrate = migrate;
