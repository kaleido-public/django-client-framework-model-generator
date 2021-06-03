import {
    ClassType,
    kotlinOptions,
    KotlinRenderer,
    KotlinTargetLanguage,
    getOptionValues,
    RenderContext,
    Name,
    Namer,
    nullableFromUnion,
    UnionType,
    ClassProperty,
    EnumType,
} from "quicktype/dist/quicktype-core"

import { relationTypeAttributeKind } from "./RelationTypeAttributeKind"

export class KotlinXTargetLanguage extends KotlinTargetLanguage {
    constructor() {
        // In the constructor we call the super constructor with fixed display name,
        // names, and extension, so we don't have to do it when instantiating the class.
        // Our class is not meant to be extensible in turn, so that's okay.
        super()
    }

    // "makeRenderer" instantiates our "KotlinXRenderer".  "kotlinOptions" are the
    // values for the customization options for C#, and "getOptionValues" translates the
    // untyped string values to the typed values that the renderer likes.
    protected makeRenderer(
        renderContext: RenderContext,
        untypedOptionValues: { [name: string]: any }
    ): KotlinRenderer {
        return new KotlinXRenderer(
            this,
            renderContext,
            getOptionValues(kotlinOptions, untypedOptionValues)
        )
    }
}

class KotlinXRenderer extends KotlinRenderer {
    identity_namer = new Namer("identity", (name) => name, [])

    protected emitClassDefinitionMethods(c: ClassType, className: Name): void {
        this.emitLine("): Model {")
        this.indent(() => {
            this.emitRelationManagers(c, className)
        })
        this.emitLine("}")
    }

    // protected makeNamedTypeNamer(): Namer {
    //   return this.identity_namer;
    // }

    protected namerForObjectProperty(): Namer {
        return this.identity_namer
    }

    protected makeUnionMemberNamer(): Namer {
        return this.identity_namer
    }

    protected makeEnumCaseNamer(): Namer {
        return this.identity_namer
    }

    protected emitClassProperties(c: ClassType, className: Name): void {
        const kotlinType = (p: ClassProperty) => {
            if (p.isOptional) {
                return [this.kotlinType(p.type, true, true), "?"]
            } else {
                return this.kotlinType(p.type, true)
            }
        }

        let count = c.getProperties().size
        let first = true
        this.forEachClassProperty(c, "none", (name: Name, jsonName, p) => {
            const nullable =
                p.type.kind === "union" &&
                nullableFromUnion(p.type as UnionType) !== null
            const nullableOrOptional =
                p.isOptional || p.type.kind === "null" || nullable
            const last = --count === 0
            let meta: Array<() => void> = []

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

    protected emitRelationManagers(c: ClassType, className: Name): void {
        // All the type's attributes
        const attributes = c.getAttributes()
        // The game object attribute, or "undefined"
        const relation_managers =
            relationTypeAttributeKind.tryGetInAttributes(attributes) ?? {}
        for (const key in relation_managers) {
            const type = relation_managers[key].type
            const to = relation_managers[key].to
            let manager: string
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

    protected emitClassAnnotations(c: ClassType, className: Name) {
        this.emitLine("@Serializable")
    }

    protected emitClassDefinition(c: ClassType, className: Name): void {
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

    protected emitHeader(): void {
        this.emitLine("import kotlinx.serialization.*")
        this.emitLine("import kotlinx.serialization.json.*")
        this.emitLine("import kotlinx.serialization.descriptors.*")
        this.emitLine("import kotlinx.serialization.encoding.*")
        this.emitLine("import django_client_framework.*")
    }

    protected emitEnumDefinition(e: EnumType, enumName: Name): void {
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
