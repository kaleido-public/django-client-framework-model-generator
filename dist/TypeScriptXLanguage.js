"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.TypeScriptXRenderer = exports.TypeScriptXTargetLanguage = void 0
const quicktype_core_1 = require("quicktype/dist/quicktype-core")
const Strings_1 = require("quicktype/dist/quicktype-core/support/Strings")
const RelationTypeAttributeKind_1 = require("./RelationTypeAttributeKind")
class TypeScriptXTargetLanguage extends quicktype_core_1.TypeScriptTargetLanguage {
    makeRenderer(renderContext, untypedOptionValues) {
        return new TypeScriptXRenderer(
            this,
            renderContext,
            quicktype_core_1.getOptionValues(
                quicktype_core_1.tsFlowOptions,
                untypedOptionValues
            )
        )
    }
}
exports.TypeScriptXTargetLanguage = TypeScriptXTargetLanguage
class TypeScriptXRenderer extends quicktype_core_1.TypeScriptRenderer {
    constructor() {
        super(...arguments)
        this.identity_namer = new quicktype_core_1.Namer(
            "identity",
            (name) => name,
            []
        )
    }
    emitSourceStructure() {
        if (this.leadingComments !== undefined) {
            this.emitCommentLines(this.leadingComments)
        } else {
            this.emitUsageComments()
        }
        this.emitModuleImports()
        this.emitTypes()
        this.emitConvertModule()
        this.emitConvertModuleHelpers()
        this.emitModuleExports()
    }
    namerForObjectProperty() {
        return this.identity_namer
    }
    makeEnumCaseNamer() {
        return this.identity_namer
    }
    emitClassBlock(c, className) {
        this.emitBlock(
            ["export class ", className, " extends d.Model "],
            "",
            () => {
                this.emitClassBlockBody(c, className)
                this.emitRelationManagers(c, className)
                this.emitCollectionManager(c, className)
            }
        )
    }
    emitClassBlockBody(c, className) {
        this.emitLine('_model_name = "', className, '"')
        this.emitPropertyTable(c, (name, _jsonName, p) => {
            const t = p.type
            return [
                [name, p.isOptional ? "?" : "!", ": "],
                [this.sourceFor(t).source, ";"],
            ]
        })
    }
    emitCollectionManager(c, className) {
        this.emitLine(
            "static objects = new d.CollectionManager(",
            className,
            ")"
        )
    }
    emitRelationManagers(c, className) {
        // All the type's attributes
        const attributes = c.getAttributes()
        const relation_managers =
            RelationTypeAttributeKind_1.relationTypeAttributeKind.tryGetInAttributes(
                attributes
            )
        for (const key in relation_managers) {
            const type = relation_managers[key].type
            const to = relation_managers[key].to
            let manager
            if (["ManyToManyRel", "ManyToOneRel"].includes(type)) {
                manager = "d.RelatedCollectionManager"
            } else {
                manager = "d.RelatedObjectManager"
            }
            this.emitLine(
                `get ${key}(): ${manager}<s.${to}, `,
                className,
                `> { return new ${manager}(s.${to}, this, "${key}") }`
            )
        }
    }
    emitEnum(e, enumName) {
        this.emitDescription(this.descriptionForType(e))
        this.emitBlock(["enum ", enumName, " "], "", () => {
            this.forEachEnumCase(e, "none", (name, jsonName) => {
                this.emitLine(
                    name,
                    ` = "${Strings_1.utf16StringEscape(jsonName)}",`
                )
            })
        })
    }
    emitModuleImports() {
        this.emitLine("import * as d from 'django-client-framework'")
        this.emitLine("import * as s from '.'")
    }
}
exports.TypeScriptXRenderer = TypeScriptXRenderer
//# sourceMappingURL=TypeScriptXLanguage.js.map
