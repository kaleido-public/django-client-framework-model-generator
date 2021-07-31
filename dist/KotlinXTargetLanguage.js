"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.KotlinXTargetLanguage = void 0
const quicktype_core_1 = require("quicktype/dist/quicktype-core")
const RelationTypeAttributeKind_1 = require("./RelationTypeAttributeKind")
class KotlinXTargetLanguage extends quicktype_core_1.KotlinTargetLanguage {
    constructor() {
        // In the constructor we call the super constructor with fixed display name,
        // names, and extension, so we don't have to do it when instantiating the class.
        // Our class is not meant to be extensible in turn, so that's okay.
        super()
    }
    // "makeRenderer" instantiates our "KotlinXRenderer".  "kotlinOptions" are the
    // values for the customization options for C#, and "getOptionValues" translates the
    // untyped string values to the typed values that the renderer likes.
    makeRenderer(renderContext, untypedOptionValues) {
        return new KotlinXRenderer(
            this,
            renderContext,
            quicktype_core_1.getOptionValues(
                quicktype_core_1.kotlinOptions,
                untypedOptionValues
            )
        )
    }
}
exports.KotlinXTargetLanguage = KotlinXTargetLanguage
class KotlinXRenderer extends quicktype_core_1.KotlinRenderer {
    constructor() {
        super(...arguments)
        this.identity_namer = new quicktype_core_1.Namer(
            "identity",
            (name) => name,
            []
        )
    }
    emitClassDefinitionMethods(c, className) {
        this.emitLine("): Model {")
        this.indent(() => {
            this.emitRelationManagers(c, className)
        })
        this.emitLine("}")
    }
    // protected makeNamedTypeNamer(): Namer {
    //   return this.identity_namer;
    // }
    namerForObjectProperty() {
        return this.identity_namer
    }
    makeUnionMemberNamer() {
        return this.identity_namer
    }
    makeEnumCaseNamer() {
        return this.identity_namer
    }
    emitClassProperties(c, className) {
        const kotlinType = (p) => {
            if (p.isOptional) {
                return [this.kotlinType(p.type, true, true), "?"]
            } else {
                return this.kotlinType(p.type, true)
            }
        }
        let count = c.getProperties().size
        let first = true
        this.forEachClassProperty(c, "none", (name, jsonName, p) => {
            const nullable =
                p.type.kind === "union" &&
                quicktype_core_1.nullableFromUnion(p.type) !== null
            const nullableOrOptional =
                p.isOptional || p.type.kind === "null" || nullable
            const last = --count === 0
            let meta = []
            const description = this.descriptionForClassProperty(c, jsonName)
            if (description !== undefined) {
                meta.push(() => this.emitDescription(description))
            }
            this.renameAttribute(name, jsonName, !nullableOrOptional, meta)
            if (meta.length > 0 && !first) {
                this.ensureBlankLine()
            }
            for (const emit of meta) {
                emit()
            }
            let override = jsonName == "id" ? "override " : ""
            this.emitLine(
                override,
                "val ",
                name,
                ": ",
                kotlinType(p),
                nullableOrOptional ? " = null" : "",
                last ? "" : ","
            )
            if (meta.length > 0 && !last) {
                this.ensureBlankLine()
            }
            first = false
        })
    }
    emitRelationManagers(c, className) {
        var _a
        // All the type's attributes
        const attributes = c.getAttributes()
        // The game object attribute, or "undefined"
        const relation_managers =
            (_a =
                RelationTypeAttributeKind_1.relationTypeAttributeKind.tryGetInAttributes(
                    attributes
                )) !== null && _a !== void 0
                ? _a
                : {}
        for (const key in relation_managers) {
            const type = relation_managers[key].type
            const to = relation_managers[key].to
            let manager
            if (["ManyToManyRel", "ManyToOneRel"].includes(type)) {
                manager = "RelatedCollectionManager"
            } else {
                manager = "RelatedObjectManager"
            }
            this.emitLine("val ", key, `: ${manager}<${to}, `, className, `>`)
            this.indent(() => {
                this.emitLine(
                    "get() { ",
                    `return ${manager}(this, "${key}")`,
                    " }"
                )
            })
        }
    }
    emitClassAnnotations(c, className) {
        this.emitLine("@Serializable")
    }
    emitClassDefinition(c, className) {
        if (c.getProperties().size === 0) {
            this.emitEmptyClassDefinition(c, className)
            return
        }
        this.emitDescription(this.descriptionForType(c))
        this.emitClassAnnotations(c, className)
        this.emitLine("data class ", className, " (")
        this.indent(() => {
            this.emitClassProperties(c, className)
        })
        this.emitClassDefinitionMethods(c, className)
    }
    emitHeader() {
        this.emitLine("import kotlinx.serialization.*")
        this.emitLine("import kotlinx.serialization.json.*")
        this.emitLine("import kotlinx.serialization.descriptors.*")
        this.emitLine("import kotlinx.serialization.encoding.*")
        this.emitLine("import django_client_framework.*")
    }
    emitEnumDefinition(e, enumName) {
        this.emitDescription(this.descriptionForType(e))
        this.emitItem("enum class ")
        this.emitItem(enumName)
        this.emitItem(" { ")
        let count = e.cases.size
        this.forEachEnumCase(e, "none", (name) => {
            this.emitItem(name)
            this.emitItem(`${--count === 0 ? "" : ", "}`)
        })
        this.emitItem(" } ")
        this.emitLine()
    }
}
//# sourceMappingURL=KotlinXTargetLanguage.js.map
