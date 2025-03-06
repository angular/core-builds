'use strict';
/**
 * @license Angular v20.0.0-next.1+sha-1b91de3
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

require('os');
require('typescript');
var checker = require('./checker-e8a16b54.js');
require('./program-2f63739d.js');
require('path');

/**
 * @module
 * @description
 * Entry point for all public APIs of the compiler-cli package.
 */
new checker.Version('20.0.0-next.1+sha-1b91de3');

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["debug"] = 0] = "debug";
    LogLevel[LogLevel["info"] = 1] = "info";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["error"] = 3] = "error";
})(LogLevel || (LogLevel = {}));

checker.setFileSystem(new checker.NodeJSFileSystem());
