'use strict';
/**
 * @license Angular v19.2.1+sha-8d770ec
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

require('os');
require('typescript');
var checker = require('./checker-89987c98.js');
require('./program-0e1d4f10.js');
require('path');

/**
 * @module
 * @description
 * Entry point for all public APIs of the compiler-cli package.
 */
new checker.Version('19.2.1+sha-8d770ec');

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["debug"] = 0] = "debug";
    LogLevel[LogLevel["info"] = 1] = "info";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["error"] = 3] = "error";
})(LogLevel || (LogLevel = {}));

checker.setFileSystem(new checker.NodeJSFileSystem());
