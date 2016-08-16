/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as test_compiler from './testing/test_compiler';
import * as test_component_builder from './testing/test_component_builder';
export declare namespace __core_private_testing_types__ {
    type TestingCompiler = test_compiler.TestingCompiler;
    var TestingCompiler: typeof test_compiler.TestingCompiler;
    type TestingCompilerFactory = test_compiler.TestingCompilerFactory;
    var TestingCompilerFactory: typeof test_compiler.TestingCompilerFactory;
    type TestComponentBuilder = test_component_builder.TestComponentBuilder;
    var TestComponentBuilder: typeof test_component_builder.TestComponentBuilder;
}
export declare var __core_private_testing__: {
    TestingCompiler: typeof test_compiler.TestingCompiler;
    TestingCompilerFactory: typeof test_compiler.TestingCompilerFactory;
    TestComponentBuilder: typeof test_component_builder.TestComponentBuilder;
};
