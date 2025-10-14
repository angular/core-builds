'use strict';
/**
 * @license Angular v21.0.0-next.7+sha-d03970f
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var project_tsconfig_paths = require('./project_tsconfig_paths-BP6O7cP-.cjs');
require('./index-BoMQrX9c.cjs');
require('path');
require('node:path');
var project_paths = require('./project_paths-CEglkbfK.cjs');
var ng_component_template = require('./ng_component_template-jWLoHo2k.cjs');
var parse_html = require('./parse_html-CwjkBw5J.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./ng_decorators-BI0uV7KI.cjs');
require('./imports-DwPXlGFl.cjs');
require('./property_name-BBwFuqMe.cjs');

function migrateTemplateToSelfClosingTags(template) {
    let parsed = parse_html.parseTemplate(template);
    if (parsed.tree === undefined) {
        return { migrated: template, changed: false, replacementCount: 0 };
    }
    const visitor = new AngularElementCollector();
    project_tsconfig_paths.visitAll$1(visitor, parsed.tree.rootNodes);
    let newTemplate = template;
    let changedOffset = 0;
    let replacementCount = 0;
    for (let element of visitor.elements) {
        const { start, end, tagName } = element;
        const currentLength = newTemplate.length;
        const templatePart = newTemplate.slice(start + changedOffset, end + changedOffset);
        const convertedTemplate = replaceWithSelfClosingTag(templatePart, tagName);
        // if the template has changed, replace the original template with the new one
        if (convertedTemplate.length !== templatePart.length) {
            newTemplate = replaceTemplate(newTemplate, convertedTemplate, start, end, changedOffset);
            changedOffset += newTemplate.length - currentLength;
            replacementCount++;
        }
    }
    return { migrated: newTemplate, changed: changedOffset !== 0, replacementCount };
}
function replaceWithSelfClosingTag(html, tagName) {
    const pattern = new RegExp(`<\\s*${tagName}\\s*([^>]*?(?:"[^"]*"|'[^']*'|[^'">])*)\\s*>([\\s\\S]*?)<\\s*/\\s*${tagName}\\s*>`, 'gi');
    return html.replace(pattern, (_, content) => `<${tagName}${content ? ` ${content}` : ''} />`);
}
/**
 * Replace the value in the template with the new value based on the start and end position + offset
 */
function replaceTemplate(template, replaceValue, start, end, offset) {
    return template.slice(0, start + offset) + replaceValue + template.slice(end + offset);
}
const ALL_HTML_TAGS = new project_tsconfig_paths.DomElementSchemaRegistry().allKnownElementNames();
class AngularElementCollector extends project_tsconfig_paths.RecursiveVisitor$1 {
    elements = [];
    constructor() {
        super();
    }
    visitElement(element) {
        if (!element.isSelfClosing &&
            !ALL_HTML_TAGS.includes(element.name) &&
            this.elementHasNoContent(element)) {
            this.elements.push({
                tagName: element.name,
                start: element.sourceSpan.start.offset,
                end: element.sourceSpan.end.offset,
            });
        }
        return super.visitElement(element, null);
    }
    elementHasNoContent(element) {
        if (!element.children?.length) {
            return true;
        }
        if (element.children.length === 1) {
            const child = element.children[0];
            return child instanceof project_tsconfig_paths.Text && /^\s*$/.test(child.value);
        }
        return false;
    }
}

class SelfClosingTagsMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const { sourceFiles, program } = info;
        const typeChecker = program.getTypeChecker();
        const tagReplacements = [];
        for (const sf of sourceFiles) {
            ts.forEachChild(sf, (node) => {
                // Skipping any non component declarations
                if (!ts.isClassDeclaration(node)) {
                    return;
                }
                const file = project_paths.projectFile(node.getSourceFile(), info);
                if (this.config.shouldMigrate && this.config.shouldMigrate(file) === false) {
                    return;
                }
                const templateVisitor = new ng_component_template.NgComponentTemplateVisitor(typeChecker);
                templateVisitor.visitNode(node);
                templateVisitor.resolvedTemplates.forEach((template) => {
                    const { migrated, changed, replacementCount } = migrateTemplateToSelfClosingTags(template.content);
                    if (!changed) {
                        return;
                    }
                    const fileToMigrate = template.inline
                        ? file
                        : project_paths.projectFile(template.filePath, info);
                    const end = template.start + template.content.length;
                    const replacements = [
                        prepareTextReplacement(fileToMigrate, migrated, template.start, end),
                    ];
                    const fileReplacements = tagReplacements.find((tagReplacement) => tagReplacement.file === file);
                    if (fileReplacements) {
                        fileReplacements.replacements.push(...replacements);
                        fileReplacements.replacementCount += replacementCount;
                    }
                    else {
                        tagReplacements.push({ file, replacements, replacementCount });
                    }
                });
            });
        }
        return project_paths.confirmAsSerializable({ tagReplacements });
    }
    async combine(unitA, unitB) {
        return project_paths.confirmAsSerializable({
            tagReplacements: [...unitA.tagReplacements, ...unitB.tagReplacements],
        });
    }
    async globalMeta(combinedData) {
        const globalMeta = {
            tagReplacements: combinedData.tagReplacements,
        };
        return project_paths.confirmAsSerializable(globalMeta);
    }
    async stats(globalMetadata) {
        const touchedFilesCount = globalMetadata.tagReplacements.length;
        const replacementCount = globalMetadata.tagReplacements.reduce((acc, cur) => acc + cur.replacementCount, 0);
        return project_paths.confirmAsSerializable({
            touchedFilesCount,
            replacementCount,
        });
    }
    async migrate(globalData) {
        return { replacements: globalData.tagReplacements.flatMap(({ replacements }) => replacements) };
    }
}
function prepareTextReplacement(file, replacement, start, end) {
    return new project_paths.Replacement(file, new project_paths.TextUpdate({
        position: start,
        end: end,
        toInsert: replacement,
    }));
}

function migrate(options) {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new SelfClosingTagsMigration({
                shouldMigrate: (file) => {
                    return (file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                        !/(^|\/)node_modules\//.test(file.rootRelativePath));
                },
            }),
            beforeProgramCreation: (tsconfigPath, stage) => {
                if (stage === project_paths.MigrationStage.Analysis) {
                    context.logger.info(`Preparing analysis for: ${tsconfigPath}...`);
                }
                else {
                    context.logger.info(`Running migration for: ${tsconfigPath}...`);
                }
            },
            beforeUnitAnalysis: (tsconfigPath) => {
                context.logger.info(`Scanning for component tags: ${tsconfigPath}...`);
            },
            afterAllAnalyzed: () => {
                context.logger.info(``);
                context.logger.info(`Processing analysis data between targets...`);
                context.logger.info(``);
            },
            afterAnalysisFailure: () => {
                context.logger.error('Migration failed unexpectedly with no analysis data');
            },
            whenDone: ({ touchedFilesCount, replacementCount }) => {
                context.logger.info('');
                context.logger.info(`Successfully migrated to self-closing tags 🎉`);
                context.logger.info(`  -> Migrated ${replacementCount} components to self-closing tags in ${touchedFilesCount} component files.`);
            },
        });
    };
}

exports.migrate = migrate;
