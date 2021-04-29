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
    JSONSchema,
    Ref,
    JSONSchemaType,
    JSONSchemaAttributes,
    EnumType,
} from "quicktype/dist/quicktype-core"

import {
    RelationManagerSet,
    relationTypeAttributeKind,
} from "./RelationTypeAttributeKind"

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

// "schema" is the JSON object in the schema for the type it's being applied to.
// In the case of our "Player" type, that would be the object at "definitions.Player"
// in the schema.

// "canonicalRef" is the location in the schema of that type.  We only use it in an
// error message here.

// "types" is a set of JSON type specifiers, such as "object", "string", or
// "boolean".  The reason it's a set and not just a single one is that one type
// within the schema can specify values of more than one JSON type.  For example,
// { "type": ["string", "boolean"] } is a JSON Schema for "all strings and all
// booleans".
export function relationAttributeProducer(
    schema: JSONSchema,
    canonicalRef: Ref,
    types: Set<JSONSchemaType>
): JSONSchemaAttributes | undefined {
    // Booleans are valid JSON Schemas, too: "true" means "all values allowed" and
    // "false" means "no values allowed".  In fact, the "false" for
    // additionalProperties in our schema is a case of the latter.  For that reason,
    // our producer could be called on a boolean, which we have to check for first.
    if (typeof schema !== "object") return undefined

    // Next we check whether the type we're supposed to produce attributes for even
    // allows objects as values.  If it doesn't, it's not our business, so we
    // return "undefined".
    if (!types.has("object")) return undefined

    // Now we can finally check whether our type is supposed to be a game object.
    let relational_properties: RelationManagerSet
    if (schema.relationalProperties === undefined) {
        // If it doesn't have the "relationalProperties" property, it isn't.
        relational_properties = {}
    } else if (typeof schema.relationalProperties === "object") {
        // If it does have it, we make sure it's a object and use its value.
        relational_properties = schema.relationalProperties
    } else {
        // If it's not a object, we throw an exception to let the user know
        // what's what.
        throw new Error(`relationalProperties is not a object in ${canonicalRef}`)
    }

    // Lastly, we generate the type attribute and return it, which requires a bit of
    // ceremony.  A producer is allowed to return more than one type attribute, so to
    // know which attribute corresponds to which attribute kind, it needs to be wrapped
    // in a "Map", which is what "makeAttributes" does.  The "forType" specifies that
    // these attributes go on the actual types specified in the schema.  We won't go
    // into the other possibilities here.
    return {
        forType: relationTypeAttributeKind.makeAttributes(relational_properties),
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
            relationTypeAttributeKind.tryGetInAttributes(attributes)
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
                this.emitLine("get() { ", `return ${manager}(this, "${key}")`, " }")
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
