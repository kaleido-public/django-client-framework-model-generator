"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.SwiftXRenderer = exports.SwiftXTargetLanguage = void 0
const quicktype_core_1 = require("quicktype/dist/quicktype-core")
const RelationTypeAttributeKind_1 = require("./RelationTypeAttributeKind")
class SwiftXTargetLanguage extends quicktype_core_1.SwiftTargetLanguage {
    makeRenderer(renderContext, untypedOptionValues) {
        return new SwiftXRenderer(
            this,
            renderContext,
            quicktype_core_1.getOptionValues(
                quicktype_core_1.swiftOptions,
                untypedOptionValues
            )
        )
    }
}
exports.SwiftXTargetLanguage = SwiftXTargetLanguage
class SwiftXRenderer extends quicktype_core_1.SwiftRenderer {
    constructor() {
        super(...arguments)
        this.identity_namer = new quicktype_core_1.Namer(
            "identity",
            (name) => name,
            []
        )
    }
    namerForObjectProperty() {
        return this.identity_namer
    }
    makeUnionMemberNamer() {
        return this.identity_namer
    }
    makeEnumCaseNamer() {
        return this.identity_namer
    }
    renderSingleFileHeaderComments() {
        this.emitLineOnce(
            "// This file was generated from JSON Schema using quicktype, do not modify it directly."
        )
    }
    emitMark(line, horizontalLine = false) {}
    getProtocolString(_t, isClass) {
        return ": Model"
    }
    renderClassDefinition(c, className) {
        this.startFile(className)
        this.renderHeader(c, className)
        this.emitDescription(this.descriptionForType(c))
        this.emitMark(this.sourcelikeToString(className), true)
        const isClass = this._options.useClasses || this.isCycleBreakerType(c)
        const structOrClass = isClass ? "class" : "struct"
        if (isClass && this._options.objcSupport) {
            // [Michael Fey (@MrRooni), 2019-4-24] Swift 5 or greater, must come before the access declaration for the class.
            this.emitItem(this.objcMembersDeclaration)
        }
        this.emitBlockWithAccess(
            [structOrClass, " ", className, this.getProtocolString(c, isClass)],
            () => {
                this.forEachClassProperty(c, "none", (name, jsonName, p) => {
                    const description = this.descriptionForClassProperty(
                        c,
                        jsonName
                    )
                    const propertyLines = this.propertyLinesDefinitionX(
                        jsonName,
                        name,
                        p
                    )
                    this.emitDescription(description)
                    this.emitLine(propertyLines)
                })
                this.emitRelationManagers(c, className)
            }
        )
        this.endFile()
    }
    propertyLinesDefinitionX(jsonName, name, parameter) {
        if (jsonName == "id") {
            return [this.accessLevel, "let id: UInt"]
        }
        return [
            this.accessLevel,
            "var ",
            name,
            ": ",
            this.swiftPropertyType(parameter),
        ]
    }
    emitRelationManagers(c, className) {
        // All the type's attributes
        const attributes = c.getAttributes()
        // The game object attribute, or "undefined"
        const relation_managers =
            RelationTypeAttributeKind_1.relationTypeAttributeKind.tryGetInAttributes(
                attributes
            )
        for (const key in relation_managers) {
            const type = relation_managers[key].type
            const to = relation_managers[key].to
            let manager
            if (["ManyToManyRel", "ManyToOneRel"].includes(type)) {
                manager = "RelatedCollectionManager"
            } else {
                manager = "RelatedObjectManager"
            }
            this.emitLine(
                `var ${key}: ${manager}<${to}, `,
                className,
                `> { .init(id, "${key}") }`
            )
        }
    }
}
exports.SwiftXRenderer = SwiftXRenderer
//# sourceMappingURL=SwiftXTargetLanguage.js.map
