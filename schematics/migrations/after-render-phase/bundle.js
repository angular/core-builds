var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve3, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve3(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// bazel-out/k8-fastbuild/bin/packages/core/schematics/migrations/after-render-phase/index.mjs
var after_render_phase_exports = {};
__export(after_render_phase_exports, {
  default: () => after_render_phase_default
});
module.exports = __toCommonJS(after_render_phase_exports);
var import_schematics = require("@angular-devkit/schematics");
var import_path3 = require("path");

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/project_tsconfig_paths.mjs
var import_core = require("@angular-devkit/core");
function getProjectTsConfigPaths(tree) {
  return __async(this, null, function* () {
    const buildPaths = /* @__PURE__ */ new Set();
    const testPaths = /* @__PURE__ */ new Set();
    const workspace = yield getWorkspace(tree);
    for (const [, project] of workspace.projects) {
      for (const [name, target] of project.targets) {
        if (name !== "build" && name !== "test") {
          continue;
        }
        for (const [, options] of allTargetOptions(target)) {
          const tsConfig = options["tsConfig"];
          if (typeof tsConfig !== "string" || !tree.exists(tsConfig)) {
            continue;
          }
          if (name === "build") {
            buildPaths.add((0, import_core.normalize)(tsConfig));
          } else {
            testPaths.add((0, import_core.normalize)(tsConfig));
          }
        }
      }
    }
    return {
      buildPaths: [...buildPaths],
      testPaths: [...testPaths]
    };
  });
}
function* allTargetOptions(target) {
  if (target.options) {
    yield [void 0, target.options];
  }
  if (!target.configurations) {
    return;
  }
  for (const [name, options] of Object.entries(target.configurations)) {
    if (options) {
      yield [name, options];
    }
  }
}
function createHost(tree) {
  return {
    readFile(path2) {
      return __async(this, null, function* () {
        const data = tree.read(path2);
        if (!data) {
          throw new Error("File not found.");
        }
        return import_core.virtualFs.fileBufferToString(data);
      });
    },
    writeFile(path2, data) {
      return __async(this, null, function* () {
        return tree.overwrite(path2, data);
      });
    },
    isDirectory(path2) {
      return __async(this, null, function* () {
        return !tree.exists(path2) && tree.getDir(path2).subfiles.length > 0;
      });
    },
    isFile(path2) {
      return __async(this, null, function* () {
        return tree.exists(path2);
      });
    }
  };
}
function getWorkspace(tree) {
  return __async(this, null, function* () {
    const host = createHost(tree);
    const { workspace } = yield import_core.workspaces.readWorkspace("/", host);
    return workspace;
  });
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/compiler_host.mjs
var import_path = require("path");
var import_typescript2 = __toESM(require("typescript"), 1);

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/parse_tsconfig.mjs
var path = __toESM(require("path"), 1);
var import_typescript = __toESM(require("typescript"), 1);
function parseTsconfigFile(tsconfigPath, basePath) {
  const { config } = import_typescript.default.readConfigFile(tsconfigPath, import_typescript.default.sys.readFile);
  const parseConfigHost = {
    useCaseSensitiveFileNames: import_typescript.default.sys.useCaseSensitiveFileNames,
    fileExists: import_typescript.default.sys.fileExists,
    readDirectory: import_typescript.default.sys.readDirectory,
    readFile: import_typescript.default.sys.readFile
  };
  if (!path.isAbsolute(basePath)) {
    throw Error("Unexpected relative base path has been specified.");
  }
  return import_typescript.default.parseJsonConfigFileContent(config, parseConfigHost, basePath, {});
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/compiler_host.mjs
function createMigrationProgram(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles) {
  const { rootNames, options, host } = createProgramOptions(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles);
  return import_typescript2.default.createProgram(rootNames, options, host);
}
function createProgramOptions(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles, optionOverrides) {
  tsconfigPath = (0, import_path.resolve)(basePath, tsconfigPath);
  const parsed = parseTsconfigFile(tsconfigPath, (0, import_path.dirname)(tsconfigPath));
  const options = optionOverrides ? __spreadValues(__spreadValues({}, parsed.options), optionOverrides) : parsed.options;
  const host = createMigrationCompilerHost(tree, options, basePath, fakeFileRead);
  return { rootNames: parsed.fileNames.concat(additionalFiles || []), options, host };
}
function createMigrationCompilerHost(tree, options, basePath, fakeRead) {
  const host = import_typescript2.default.createCompilerHost(options, true);
  const defaultReadFile = host.readFile;
  host.readFile = (fileName) => {
    var _a;
    const treeRelativePath = (0, import_path.relative)(basePath, fileName);
    let result = fakeRead == null ? void 0 : fakeRead(treeRelativePath);
    if (typeof result !== "string") {
      result = treeRelativePath.startsWith("..") ? defaultReadFile.call(host, fileName) : (_a = tree.read(treeRelativePath)) == null ? void 0 : _a.toString();
    }
    return typeof result === "string" ? result.replace(/^\uFEFF/, "") : void 0;
  };
  return host;
}
function canMigrateFile(basePath, sourceFile, program) {
  if (sourceFile.fileName.endsWith(".ngtypecheck.ts") || sourceFile.isDeclarationFile || program.isSourceFileFromExternalLibrary(sourceFile)) {
    return false;
  }
  return !(0, import_path.relative)(basePath, sourceFile.fileName).startsWith("..");
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/migrations/after-render-phase/migration.mjs
var import_typescript6 = __toESM(require("typescript"), 1);

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/change_tracker.mjs
var import_typescript4 = __toESM(require("typescript"), 1);

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/import_manager.mjs
var import_path2 = require("path");
var import_typescript3 = __toESM(require("typescript"), 1);
var ImportManager = class {
  constructor(getUpdateRecorder, printer) {
    __publicField(this, "getUpdateRecorder");
    __publicField(this, "printer");
    __publicField(this, "updatedImports", /* @__PURE__ */ new Map());
    __publicField(this, "usedIdentifierNames", /* @__PURE__ */ new Map());
    __publicField(this, "newImports", /* @__PURE__ */ new Map());
    __publicField(this, "quoteStyles", {});
    __publicField(this, "importCache", []);
    this.getUpdateRecorder = getUpdateRecorder;
    this.printer = printer;
  }
  addImportToSourceFile(sourceFile, symbolName, moduleName, alias = null, typeImport = false, keepSymbolName = false) {
    const sourceDir = (0, import_path2.dirname)(sourceFile.fileName);
    let importStartIndex = 0;
    let existingImport = null;
    const cachedImport = this.importCache.find((c) => c.sourceFile === sourceFile && c.symbolName === symbolName && c.moduleName === moduleName && c.alias === alias);
    if (cachedImport) {
      return cachedImport.identifier;
    }
    for (let i = sourceFile.statements.length - 1; i >= 0; i--) {
      const statement = sourceFile.statements[i];
      if (!import_typescript3.default.isImportDeclaration(statement) || !import_typescript3.default.isStringLiteral(statement.moduleSpecifier) || !statement.importClause) {
        continue;
      }
      if (importStartIndex === 0) {
        importStartIndex = this._getEndPositionOfNode(statement);
      }
      const moduleSpecifier = statement.moduleSpecifier.text;
      if (moduleSpecifier.startsWith(".") && (0, import_path2.resolve)(sourceDir, moduleSpecifier) !== (0, import_path2.resolve)(sourceDir, moduleName) || moduleSpecifier !== moduleName) {
        continue;
      }
      if (statement.importClause.namedBindings) {
        const namedBindings = statement.importClause.namedBindings;
        if (import_typescript3.default.isNamespaceImport(namedBindings) && !typeImport) {
          return import_typescript3.default.factory.createPropertyAccessExpression(import_typescript3.default.factory.createIdentifier(namedBindings.name.text), import_typescript3.default.factory.createIdentifier(alias || symbolName || "default"));
        } else if (import_typescript3.default.isNamedImports(namedBindings) && symbolName) {
          const existingElement = namedBindings.elements.find((e) => {
            if (alias) {
              return e.propertyName && e.name.text === alias && e.propertyName.text === symbolName;
            }
            return e.propertyName ? e.propertyName.text === symbolName : e.name.text === symbolName;
          });
          if (existingElement) {
            return import_typescript3.default.factory.createIdentifier(existingElement.name.text);
          }
          existingImport = statement;
        }
      } else if (statement.importClause.name && !symbolName) {
        return import_typescript3.default.factory.createIdentifier(statement.importClause.name.text);
      }
    }
    if (existingImport) {
      const { propertyName, name } = this._getImportParts(sourceFile, symbolName, alias, keepSymbolName);
      this.updatedImports.set(existingImport, (this.updatedImports.get(existingImport) || []).concat({ propertyName, importName: name }));
      this.importCache.push({ sourceFile, moduleName, symbolName, alias, identifier: name });
      return name;
    }
    let identifier = null;
    if (!this.newImports.has(sourceFile)) {
      this.newImports.set(sourceFile, {
        importStartIndex,
        defaultImports: /* @__PURE__ */ new Map(),
        namedImports: /* @__PURE__ */ new Map()
      });
    }
    if (symbolName) {
      const { propertyName, name } = this._getImportParts(sourceFile, symbolName, alias, keepSymbolName);
      const importMap = this.newImports.get(sourceFile).namedImports;
      identifier = name;
      if (!importMap.has(moduleName)) {
        importMap.set(moduleName, []);
      }
      importMap.get(moduleName).push(import_typescript3.default.factory.createImportSpecifier(false, propertyName, name));
    } else {
      const importMap = this.newImports.get(sourceFile).defaultImports;
      identifier = this._getUniqueIdentifier(sourceFile, "defaultExport");
      importMap.set(moduleName, identifier);
    }
    this.importCache.push({ sourceFile, symbolName, moduleName, alias, identifier });
    return identifier;
  }
  recordChanges() {
    this.updatedImports.forEach((expressions, importDecl) => {
      const sourceFile = importDecl.getSourceFile();
      const recorder = this.getUpdateRecorder(sourceFile);
      const namedBindings = importDecl.importClause.namedBindings;
      const newNamedBindings = import_typescript3.default.factory.updateNamedImports(namedBindings, namedBindings.elements.concat(expressions.map(({ propertyName, importName }) => import_typescript3.default.factory.createImportSpecifier(false, propertyName, importName))));
      const newNamedBindingsText = this.printer.printNode(import_typescript3.default.EmitHint.Unspecified, newNamedBindings, sourceFile);
      recorder.updateExistingImport(namedBindings, newNamedBindingsText);
    });
    this.newImports.forEach(({ importStartIndex, defaultImports, namedImports }, sourceFile) => {
      const recorder = this.getUpdateRecorder(sourceFile);
      const useSingleQuotes = this._getQuoteStyle(sourceFile) === 0;
      defaultImports.forEach((identifier, moduleName) => {
        const newImport = import_typescript3.default.factory.createImportDeclaration(void 0, import_typescript3.default.factory.createImportClause(false, identifier, void 0), import_typescript3.default.factory.createStringLiteral(moduleName, useSingleQuotes));
        recorder.addNewImport(importStartIndex, this._getNewImportText(importStartIndex, newImport, sourceFile));
      });
      namedImports.forEach((specifiers, moduleName) => {
        const newImport = import_typescript3.default.factory.createImportDeclaration(void 0, import_typescript3.default.factory.createImportClause(false, void 0, import_typescript3.default.factory.createNamedImports(specifiers)), import_typescript3.default.factory.createStringLiteral(moduleName, useSingleQuotes));
        recorder.addNewImport(importStartIndex, this._getNewImportText(importStartIndex, newImport, sourceFile));
      });
    });
  }
  _getUniqueIdentifier(sourceFile, baseName) {
    if (this.isUniqueIdentifierName(sourceFile, baseName)) {
      this._recordUsedIdentifier(sourceFile, baseName);
      return import_typescript3.default.factory.createIdentifier(baseName);
    }
    let name = null;
    let counter = 1;
    do {
      name = `${baseName}_${counter++}`;
    } while (!this.isUniqueIdentifierName(sourceFile, name));
    this._recordUsedIdentifier(sourceFile, name);
    return import_typescript3.default.factory.createIdentifier(name);
  }
  isUniqueIdentifierName(sourceFile, name) {
    if (this.usedIdentifierNames.has(sourceFile) && this.usedIdentifierNames.get(sourceFile).indexOf(name) !== -1) {
      return false;
    }
    const nodeQueue = [sourceFile];
    while (nodeQueue.length) {
      const node = nodeQueue.shift();
      if (import_typescript3.default.isIdentifier(node) && node.text === name && (!import_typescript3.default.isImportSpecifier(node.parent) || node.parent.propertyName !== node)) {
        return false;
      }
      nodeQueue.push(...node.getChildren());
    }
    return true;
  }
  _recordUsedIdentifier(sourceFile, identifierName) {
    this.usedIdentifierNames.set(sourceFile, (this.usedIdentifierNames.get(sourceFile) || []).concat(identifierName));
  }
  _getEndPositionOfNode(node) {
    const nodeEndPos = node.getEnd();
    const commentRanges = import_typescript3.default.getTrailingCommentRanges(node.getSourceFile().text, nodeEndPos);
    if (!commentRanges || !commentRanges.length) {
      return nodeEndPos;
    }
    return commentRanges[commentRanges.length - 1].end;
  }
  _getNewImportText(importStartIndex, newImport, sourceFile) {
    const text = this.printer.printNode(import_typescript3.default.EmitHint.Unspecified, newImport, sourceFile);
    return importStartIndex === 0 ? `${text}
` : `
${text}`;
  }
  _getImportParts(sourceFile, symbolName, alias, keepSymbolName) {
    const symbolIdentifier = import_typescript3.default.factory.createIdentifier(symbolName);
    const aliasIdentifier = alias ? import_typescript3.default.factory.createIdentifier(alias) : null;
    const generatedUniqueIdentifier = this._getUniqueIdentifier(sourceFile, alias || symbolName);
    const needsGeneratedUniqueName = generatedUniqueIdentifier.text !== (alias || symbolName);
    let propertyName;
    let name;
    if (needsGeneratedUniqueName && !keepSymbolName) {
      propertyName = symbolIdentifier;
      name = generatedUniqueIdentifier;
    } else if (aliasIdentifier) {
      propertyName = symbolIdentifier;
      name = aliasIdentifier;
    } else {
      name = symbolIdentifier;
    }
    return { propertyName, name };
  }
  _getQuoteStyle(sourceFile) {
    if (!this.quoteStyles.hasOwnProperty(sourceFile.fileName)) {
      let quoteStyle;
      for (const statement of sourceFile.statements) {
        if (import_typescript3.default.isImportDeclaration(statement) && import_typescript3.default.isStringLiteralLike(statement.moduleSpecifier)) {
          quoteStyle = statement.moduleSpecifier.getText().trim().startsWith('"') ? 1 : 0;
          break;
        }
      }
      this.quoteStyles[sourceFile.fileName] = quoteStyle != null ? quoteStyle : 0;
    }
    return this.quoteStyles[sourceFile.fileName];
  }
};

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/change_tracker.mjs
var ChangeTracker = class {
  constructor(_printer, _importRemapper) {
    __publicField(this, "_printer");
    __publicField(this, "_importRemapper");
    __publicField(this, "_changes", /* @__PURE__ */ new Map());
    __publicField(this, "_importManager");
    this._printer = _printer;
    this._importRemapper = _importRemapper;
    this._importManager = new ImportManager((currentFile) => ({
      addNewImport: (start, text) => this.insertText(currentFile, start, text),
      updateExistingImport: (namedBindings, text) => this.replaceText(currentFile, namedBindings.getStart(), namedBindings.getWidth(), text)
    }), this._printer);
  }
  insertText(sourceFile, index, text) {
    this._trackChange(sourceFile, { start: index, text });
  }
  replaceText(sourceFile, start, removeLength, text) {
    this._trackChange(sourceFile, { start, removeLength, text });
  }
  replaceNode(oldNode, newNode, emitHint = import_typescript4.default.EmitHint.Unspecified, sourceFileWhenPrinting) {
    const sourceFile = oldNode.getSourceFile();
    this.replaceText(sourceFile, oldNode.getStart(), oldNode.getWidth(), this._printer.printNode(emitHint, newNode, sourceFileWhenPrinting || sourceFile));
  }
  removeNode(node) {
    this._trackChange(node.getSourceFile(), {
      start: node.getStart(),
      removeLength: node.getWidth(),
      text: ""
    });
  }
  addImport(sourceFile, symbolName, moduleName, alias = null, keepSymbolName = false) {
    if (this._importRemapper) {
      moduleName = this._importRemapper(moduleName, sourceFile.fileName);
    }
    moduleName = normalizePath(moduleName);
    return this._importManager.addImportToSourceFile(sourceFile, symbolName, moduleName, alias, false, keepSymbolName);
  }
  recordChanges() {
    this._importManager.recordChanges();
    return this._changes;
  }
  clearChanges() {
    this._changes.clear();
  }
  _trackChange(file, change) {
    const changes = this._changes.get(file);
    if (changes) {
      const insertIndex = changes.findIndex((current) => current.start <= change.start);
      if (insertIndex === -1) {
        changes.push(change);
      } else {
        changes.splice(insertIndex, 0, change);
      }
    } else {
      this._changes.set(file, [change]);
    }
  }
};
function normalizePath(path2) {
  return path2.replace(/\\/g, "/");
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/utils/typescript/imports.mjs
var import_typescript5 = __toESM(require("typescript"), 1);
function getImportOfIdentifier(typeChecker, node) {
  const symbol = typeChecker.getSymbolAtLocation(node);
  if (!symbol || symbol.declarations === void 0 || !symbol.declarations.length) {
    return null;
  }
  const decl = symbol.declarations[0];
  if (!import_typescript5.default.isImportSpecifier(decl)) {
    return null;
  }
  const importDecl = decl.parent.parent.parent;
  if (!import_typescript5.default.isImportDeclaration(importDecl) || !import_typescript5.default.isStringLiteral(importDecl.moduleSpecifier)) {
    return null;
  }
  return {
    name: decl.propertyName ? decl.propertyName.text : decl.name.text,
    importModule: importDecl.moduleSpecifier.text,
    node: importDecl
  };
}
function getImportSpecifier(sourceFile, moduleName, specifierName) {
  var _a;
  return (_a = getImportSpecifiers(sourceFile, moduleName, [specifierName])[0]) != null ? _a : null;
}
function getImportSpecifiers(sourceFile, moduleName, specifierNames) {
  var _a;
  const matches = [];
  for (const node of sourceFile.statements) {
    if (import_typescript5.default.isImportDeclaration(node) && import_typescript5.default.isStringLiteral(node.moduleSpecifier)) {
      const isMatch = typeof moduleName === "string" ? node.moduleSpecifier.text === moduleName : moduleName.test(node.moduleSpecifier.text);
      const namedBindings = (_a = node.importClause) == null ? void 0 : _a.namedBindings;
      if (isMatch && namedBindings && import_typescript5.default.isNamedImports(namedBindings)) {
        for (const specifierName of specifierNames) {
          const match = findImportSpecifier(namedBindings.elements, specifierName);
          if (match) {
            matches.push(match);
          }
        }
      }
    }
  }
  return matches;
}
function getNamedImports(sourceFile, moduleName) {
  var _a;
  for (const node of sourceFile.statements) {
    if (import_typescript5.default.isImportDeclaration(node) && import_typescript5.default.isStringLiteral(node.moduleSpecifier)) {
      const isMatch = typeof moduleName === "string" ? node.moduleSpecifier.text === moduleName : moduleName.test(node.moduleSpecifier.text);
      const namedBindings = (_a = node.importClause) == null ? void 0 : _a.namedBindings;
      if (isMatch && namedBindings && import_typescript5.default.isNamedImports(namedBindings)) {
        return namedBindings;
      }
    }
  }
  return null;
}
function findImportSpecifier(nodes, specifierName) {
  return nodes.find((element) => {
    const { name, propertyName } = element;
    return propertyName ? propertyName.text === specifierName : name.text === specifierName;
  });
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/migrations/after-render-phase/migration.mjs
var CORE = "@angular/core";
var AFTER_RENDER_PHASE_ENUM = "AfterRenderPhase";
var AFTER_RENDER_FNS = /* @__PURE__ */ new Set(["afterRender", "afterNextRender"]);
function migrateFile(sourceFile, typeChecker, rewriteFn) {
  var _a;
  const changeTracker = new ChangeTracker(import_typescript6.default.createPrinter());
  const coreImports = getNamedImports(sourceFile, CORE);
  if (!coreImports) {
    return;
  }
  const phaseEnum = getImportSpecifier(sourceFile, CORE, AFTER_RENDER_PHASE_ENUM);
  if (!phaseEnum) {
    return;
  }
  const newCoreImports = import_typescript6.default.factory.updateNamedImports(coreImports, [
    ...coreImports.elements.filter((current) => phaseEnum !== current)
  ]);
  changeTracker.replaceNode(coreImports, newCoreImports);
  import_typescript6.default.forEachChild(sourceFile, function visit(node) {
    var _a2;
    import_typescript6.default.forEachChild(node, visit);
    if (import_typescript6.default.isCallExpression(node) && import_typescript6.default.isIdentifier(node.expression) && AFTER_RENDER_FNS.has(((_a2 = getImportOfIdentifier(typeChecker, node.expression)) == null ? void 0 : _a2.name) || "")) {
      let phase;
      const [callback, options] = node.arguments;
      if (import_typescript6.default.isObjectLiteralExpression(options)) {
        const phaseProp = options.properties.find((p) => {
          var _a3;
          return ((_a3 = p.name) == null ? void 0 : _a3.getText()) === "phase";
        });
        if (phaseProp && import_typescript6.default.isPropertyAssignment(phaseProp) && import_typescript6.default.isPropertyAccessExpression(phaseProp.initializer) && phaseProp.initializer.expression.getText() === AFTER_RENDER_PHASE_ENUM) {
          phaseProp.initializer.expression;
          phase = phaseProp.initializer.name.getText();
          if (options.properties.length === 1) {
            changeTracker.removeNode(options);
          } else {
            const newOptions = import_typescript6.default.factory.createObjectLiteralExpression(options.properties.filter((p) => p !== phaseProp));
            changeTracker.replaceNode(options, newOptions);
          }
        }
      }
      if (phase) {
        phase = phase.substring(0, 1).toLocaleLowerCase() + phase.substring(1);
        const spec = import_typescript6.default.factory.createObjectLiteralExpression([
          import_typescript6.default.factory.createPropertyAssignment(import_typescript6.default.factory.createIdentifier(phase), callback)
        ]);
        changeTracker.replaceNode(callback, spec);
      }
    }
  });
  for (const changesInFile of changeTracker.recordChanges().values()) {
    for (const change of changesInFile) {
      rewriteFn(change.start, (_a = change.removeLength) != null ? _a : 0, change.text);
    }
  }
}

// bazel-out/k8-fastbuild/bin/packages/core/schematics/migrations/after-render-phase/index.mjs
function after_render_phase_default() {
  return (tree) => __async(this, null, function* () {
    const { buildPaths, testPaths } = yield getProjectTsConfigPaths(tree);
    const basePath = process.cwd();
    const allPaths = [...buildPaths, ...testPaths];
    if (!allPaths.length) {
      throw new import_schematics.SchematicsException("Could not find any tsconfig file. Cannot run the afterRender phase migration.");
    }
    for (const tsconfigPath of allPaths) {
      runMigration(tree, tsconfigPath, basePath);
    }
  });
}
function runMigration(tree, tsconfigPath, basePath) {
  const program = createMigrationProgram(tree, tsconfigPath, basePath);
  const sourceFiles = program.getSourceFiles().filter((sourceFile) => canMigrateFile(basePath, sourceFile, program));
  for (const sourceFile of sourceFiles) {
    let update = null;
    const rewriter = (startPos, width, text) => {
      if (update === null) {
        update = tree.beginUpdate((0, import_path3.relative)(basePath, sourceFile.fileName));
      }
      update.remove(startPos, width);
      if (text !== null) {
        update.insertLeft(startPos, text);
      }
    };
    migrateFile(sourceFile, program.getTypeChecker(), rewriter);
    if (update !== null) {
      tree.commitUpdate(update);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=bundle.js.map
